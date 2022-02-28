const {Command}                                  = require('discord-akairo')
const {Config, React, Wallet, Transaction, Lang} = require('../utils')

class SendCommand extends Command
{
    constructor()
    {
        super('send', {
            aliases  : ['send'],
            channel  : 'dm',
            ratelimit: 1,
            args     : [
                {
                    id     : 'amount',
                    type   : 'number',
                    default: 0
                },
                {
                    id     : 'to',
                    type   : 'string',
                    default: false,
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
            await React.error(this, message, Lang.trans(message, 'error.title.send_amount_incorrect'), Lang.trans(message, 'error.description.send_amount_incorrect'))
            return
        }
        if (amount < 0.01) {
            await React.error(this, message, Lang.trans(message, 'error.title.send_amount_incorrect'), Lang.trans(message, 'error.description.send_amount_low'))
            return
        }

        const wallet  = await Wallet.get(this, message, message.author.id)
        const token   = Config.get('token.default')
        const balance = await Wallet.balance(wallet, token)
        const from    = wallet.address
        const to      = args.to

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, Lang.trans(message, 'error.title.insufficient_funds'), Lang.trans(message, 'error.description.amount_exceeds_balance', {symbol: Config.get(`tokens.${token}.symbol`), prefix: Config.get('prefix')}))
            return
        }

        Transaction.addToQueue(this, message, from, to, amount, token).then(() => {
            Transaction.runQueue(this, message, message.author.id, true, false, true, false)
        })
    }
}

module.exports = SendCommand
