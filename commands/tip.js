const {Command}                            = require('discord-akairo')
const {Config, React, Wallet, Transaction} = require('../utils')

class TipCommand extends Command
{
    constructor()
    {
        super('tip', {
            aliases  : ['tip', 'gift', 'give'],
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
                },
                {
                    id       : 'member',
                    type     : 'member',
                    unordered: true
                }
            ]
        })
    }

    async exec(message, args)
    {
        if (!await Wallet.check(this, message, message.author.id)) {
            return
        }

        const amount    = args.amount
        const token     = args.token ?? Config.get('token.default')
        const users     = message.mentions.users.filter(function (user) {
            return !user.bot
        })
        const recipient = users.first()

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
        if (recipient.bot) {
            await React.error(this, message, `Invalid user`, `You are not allowed to tip bots`)
            return
        }
        if (recipient.id === message.author.id) {
            await React.error(this, message, `Invalid user`, `You are not allowed to tip yourself`)
            return
        }

        const wallet  = await Wallet.get(this, message, message.author.id)
        const balance = await Wallet.balance(wallet, token)

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, `Insufficient funds`, `The amount exceeds your balance + safety margin (0.001 ${Config.get(`tokens.${token}.symbol`)}). Use the \`${Config.get('prefix')}deposit\` command to get your wallet address to send some more ${Config.get(`tokens.${token}.symbol`)}. Or try again with a lower amount`)
            return
        }

        const from = wallet.address
        const to   = await Wallet.recipientAddress(this, message, recipient.id)

        if (from === to) {
            await React.error(this, message, `Invalid user`, `You are trying to tip yourself`)
            return
        }

        Transaction.addToQueue(this, message, from, to, amount, token, recipient.id).then(() => {
            Transaction.runQueue(this, message, message.author.id, false, true)
        })

        await React.message(message, 'tip', amount)
    }
}

module.exports = TipCommand