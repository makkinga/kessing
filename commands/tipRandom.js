const {Command}                                  = require('discord-akairo')
const {Config, React, Wallet, Transaction, Lang} = require('../utils')

class TipRandomCommand extends Command
{
    constructor()
    {
        super('tiprandom', {
            aliases  : ['tiprandom', 'giftramdom'],
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
        const amount = args.amount

        if (amount === 0) {
            await React.error(this, message, Lang.trans(message, 'error.title.tip_amount_incorrect'), Lang.trans(message, 'error.description.tip_amount_incorrect'))
            return
        }
        if (amount < 0.01) {
            await React.error(this, message, Lang.trans(message, 'error.title.tip_amount_incorrect'), Lang.trans(message, 'error.description.tip_amount_low'))
            return
        }

        let recipients = []
        await message.channel.messages.fetch({limit: 20})
            .then(function (lastMessages) {
                for (let [id, lastMessage] of lastMessages) {
                    let add = true

                    if (lastMessage.author.id === message.author.id) {
                        add = false
                    }

                    Wallet.address(lastMessage.author.id).then(recipientAddress => {
                        if (!recipientAddress) {
                            add = false
                        }
                    })

                    if (lastMessage.author.bot) {
                        add = false
                    }

                    if (add && !recipients.includes(lastMessage.author.id)) {
                        recipients.push(lastMessage.author.id)
                    }
                }
            })

        const wallet  = await Wallet.get(this, message, message.author.id)
        const token   = args.token ?? Config.get('token.default')
        const balance = await Wallet.balance(wallet, token)

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, Lang.trans(message, 'error.title.insufficient_funds'), Lang.trans(message, 'error.description.amount_exceeds_balance', {symbol: Config.get(`tokens.${token}.symbol`), prefix: Config.get('prefix')}))
            return
        }

        let recipient = recipients[Math.floor(Math.random() * recipients.length)]
        if (typeof recipient == 'undefined') {
            await React.error(this, message, Lang.trans(message, 'error.title.sorry'), Lang.trans(message, 'error.description.no_rain_users'))
            await message.channel.send(Lang.trans(message, 'embed.description.wake_up'))

            return
        }

        const from = wallet.address
        const to   = await Wallet.recipientAddress(this, message, recipient)

        Transaction.addToQueue(this, message, from, to, amount, token).then(() => {
            Transaction.runQueue(this, message, message.author.id)
        })

        recipient   = this.client.users.cache.get(recipient)
        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(Lang.trans('embed.title.tipped_random'))
            .setDescription(Lang.trans('embed.description.lucky_one', {user: recipient.username, amount: amount, symbol: Config.get(`tokens.${token}.symbol`)}))

        await message.author.send(embed)

        await React.message(message, 'tip', amount)
    }
}

module.exports = TipRandomCommand