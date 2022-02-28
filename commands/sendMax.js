const {Command}                            = require('discord-akairo')
const {Config, React, Wallet, Transaction} = require('../utils')

class SendMaxCommand extends Command
{
    constructor()
    {
        super('sendmax', {
            aliases  : ['sendmax'],
            channel  : 'dm',
            ratelimit: 1,
            args     : [
                {
                    id     : 'to',
                    type   : 'string',
                    default: false
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

        const wallet  = await Wallet.get(this, message, message.author.id)
        const token   = Config.get('token.default')
        const balance = await Wallet.balance(wallet, token)
        const from    = wallet.address
        const to      = args.to
        const amount  = parseFloat(balance) - 0.01

        Transaction.addToQueue(this, message, from, to, amount, token).then(() => {
            Transaction.runQueue(this, message, message.author.id, true, false, true, false)
        })
    }
}

module.exports = SendMaxCommand