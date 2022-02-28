const {Command}                          = require('discord-akairo')
const {React, Wallet, Transaction, Lang} = require('../utils')

class PingCommand extends Command
{
    constructor()
    {
        super('getgas', {
            aliases  : ['getgas'],
            ratelimit: 1,
            channel  : 'dm',
        })
    }

    async exec(message)
    {
        await React.processing(message)
        if (!await Wallet.check(this, message, message.author.id)) {
            return
        }
        const wallet  = await Wallet.get(this, message, message.author.id)
        const balance = await Wallet.gasBalance(wallet)

        if (parseFloat(balance) >= 0.1) {
            await React.error(this, message, Lang.trans(message, 'error.title.command_not_allowed'), Lang.trans(message, 'error.description.current_gas', {balance: balance}))
        } else {
            await Transaction.sendGas(this, message, process.env.BOT_WALLET_ADDRESS, wallet.address, 0.25, process.env.BOT_WALLET_PRIVATE_KEY)

            await React.success(this, message)
        }

        await React.message(message, 'get_gas')
    }
}

module.exports = PingCommand