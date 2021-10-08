const {Command}                            = require('discord-akairo')
const {Config, React, Wallet, Transaction} = require('../utils')

class TipsplitCommand extends Command
{
    constructor()
    {
        super('tipsplit', {
            aliases  : ['tipsplit', 'split', 'splitgift', 'divide', 'tipdivide', 'dividetip'],
            channel  : 'guild',
            ratelimit: 1,
            args     : [
                {
                    id     : 'amount',
                    type   : 'number',
                    default: 0
                },
                {
                    id       : 'token',
                    type     : Config.get('alternative_tokens'),
                    unordered: true
                }
            ]
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        if (!await Wallet.check(this, message, message.author.id)) {
            return
        }
        let amount        = args.amount
        const totalAmount = amount
        const recipients  = message.mentions.users.filter(function (user) {
            return !user.bot
        })

        if (amount === 0) {
            await React.error(this, message, `Tip amount incorrect`, `The tip amount is wrongly formatted or missing`)
            return
        }
        if (amount < 0.01) {
            await React.error(this, message, `Tip amount incorrect`, `The tip amount is too low`)
            return
        }
        if (!message.mentions.users.size) {
            await React.error(this, message, `Missing user`, `Please mention a valid user`)
            return
        }

        const wallet  = await Wallet.get(this, message, message.author.id)
        const token   = args.token ?? Config.get('token.default')
        const balance = await Wallet.balance(wallet, token)

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, `Insufficient funds`, `The amount exceeds your balance + safety margin (0.001 ${Config.get(`tokens.${token}.symbol`)}). Use the \`${Config.get('prefix')}deposit\` command to get your wallet address to send some more ${Config.get(`tokens.${token}.symbol`)}. Or try again with a lower amount`)
            return
        }

        const from = wallet.address

        let recipientsFiltered = []
        for (let [id, recipient] of recipients) {
            let match = true
            if (id === message.author.id) {
                match = false
            }
            if (recipient.bot) {
                match = false
            }
            recipientsFiltered.push(id)
        }

        amount = (amount / recipientsFiltered.length)

        for (let i = 0; i < recipientsFiltered.length; i++) {
            const to = await Wallet.recipientAddress(this, message, recipientsFiltered[i])

            await Transaction.addToQueue(this, message, from, to, amount, token, recipientsFiltered[i])
        }

        await Transaction.runQueue(this, message, message.author.id, false, true)

        await React.message(message, 'tip', totalAmount)
    }
}

module.exports = TipsplitCommand