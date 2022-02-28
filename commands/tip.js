const {Command}                                  = require('discord-akairo')
const {Config, React, Wallet, Transaction, Lang} = require('../utils')

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
            await React.error(this, message, Lang.trans(message, 'error.title.tip_amount_incorrect'), Lang.trans(message, 'error.description.tip_amount_incorrect'))
            return
        }
        if (amount < 0.01) {
            await React.error(this, message, Lang.trans(message, 'error.title.tip_amount_incorrect'), Lang.trans(message, 'error.description.tip_amount_low'))
            return
        }
        if (!message.mentions.users.size) {
            await React.error(this, message, Lang.trans(message, 'error.title.missing_user'), Lang.trans(message, 'error.description.user_invalid'))
            return
        }
        if (recipient.bot) {
            await React.error(this, message, Lang.trans(message, 'error.title.invalid_user'), Lang.trans(message, 'error.description.no_tipping_bots'))
            return
        }
        if (recipient.id === message.author.id) {
            await React.error(this, message, Lang.trans(message, 'error.title.invalid_user'), Lang.trans(message, 'error.description.no_tipping_self'))
            return
        }

        const wallet  = await Wallet.get(this, message, message.author.id)
        const balance = await Wallet.balance(wallet, token)

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, Lang.trans(message, 'error.title.insufficient_funds'), Lang.trans(message, 'error.description.amount_exceeds_balance', {symbol: Config.get(`tokens.${token}.symbol`), prefix: Config.get('prefix')}))
            return
        }

        const from = wallet.address
        const to   = await Wallet.recipientAddress(this, message, recipient.id)

        if (from === to) {
            await React.error(this, message, Lang.trans(message, 'error.title.invalid_user'), Lang.trans(message, 'error.description.no_tipping_self'))
            return
        }

        Transaction.addToQueue(this, message, from, to, amount, token, recipient.id).then(() => {
            Transaction.runQueue(this, message, message.author.id, false, true)
        })

        await React.message(message, 'tip', amount)
    }
}

module.exports = TipCommand