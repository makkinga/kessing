const {Command}                                                      = require('discord-akairo')
const table                                                          = require('text-table')
const {Config, Helpers, React, Wallet, Transaction, Blacklist, Lang} = require('../utils')

class RainCommand extends Command
{
    constructor()
    {
        super('rain', {
            aliases  : ['rain'],
            channel  : 'guild',
            ratelimit: 1,
            args     : [
                {
                    id       : 'amount',
                    type     : 'number',
                    unordered: true,
                    default  : 0
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

        if (amount === 0) {
            await React.error(this, message, Lang.trans(message, 'error.title.tip_amount_incorrect'), Lang.trans(message, 'error.description.tip_amount_incorrect'))
            return
        }
        if (amount < 0.01) {
            await React.error(this, message, Lang.trans(message, 'error.title.tip_amount_incorrect'), Lang.trans(message, 'error.description.tip_amount_low'))
            return
        }

        let recipients          = []
        let recipientsUsernames = []
        await message.channel.messages.fetch({limit: 20})
            .then(async function (lastMessages) {
                for (let [id, lastMessage] of lastMessages) {
                    let add = true

                    if (lastMessage.author.id === message.author.id) {
                        add = false
                    }

                    await Wallet.address(lastMessage.author.id).then(recipientAddress => {
                        if (recipientAddress === 0 || recipientAddress === '0' || recipientAddress === null || recipientAddress === 'null' || recipientAddress === false || recipientAddress === 'false' || recipientAddress === undefined || recipientAddress === 'undefined') {
                            add = false
                        }
                    })

                    if (lastMessage.author.bot) {
                        add = false
                    }

                    if (await Blacklist.listed(lastMessage.author)) {
                        add = false
                    }

                    if (add && !recipients.includes(lastMessage.author.id)) {
                        recipients.push(lastMessage.author.id)
                        recipientsUsernames.push(lastMessage.author.username)
                    }
                }
            })

        if (recipients.length === 0) {
            await React.error(this, message, Lang.trans(message, 'error.title.sorry'), Lang.trans(message, 'error.description.no_rain_users'))
            await message.channel.send(Lang.trans(message, 'embed.description.wake_up'))

            return
        }

        const wallet  = await Wallet.get(this, message, message.author.id)
        const token   = args.token ?? Config.get('token.default')
        const balance = await Wallet.balance(wallet, token)

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, Lang.trans(message, 'error.title.insufficient_funds'), Lang.trans(message, 'error.description.amount_exceeds_balance', {symbol: Config.get(`tokens.${token}.symbol`), prefix: Config.get('prefix')}))
            return
        }

        const from = wallet.address
        amount     = (amount / recipients.length)

        let recipientRows = []
        for (let i = 0; i < recipientsUsernames.length; i++) {
            recipientRows.push([
                `@${recipientsUsernames[i]}`
            ])
        }

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(Lang.trans(message, 'embed.description.you_rained'))
            .setDescription('```' + table(recipientRows) + '```')

        await message.author.send(embed)

        for (let i = 0; i < recipients.length; i++) {
            const to = await Wallet.recipientAddress(this, message, recipients[i])

            await Transaction.addToQueue(this, message, from, to, amount, token, recipients[i])
        }

        await Transaction.runQueue(this, message, message.author.id, false, true)

        await React.message(message, 'tip', totalAmount)
    }
}

module.exports = RainCommand