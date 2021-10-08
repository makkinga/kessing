const {Command}                    = require('discord-akairo')
const {React, Wallet, Transaction} = require('../utils')

class PingCommand extends Command
{
    constructor()
    {
        super('getgas', {
            aliases  : ['getgas', 'gasmeup'],
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

        if (parseFloat(balance) >= 0.01) {
            await message.react('👀')
            await React.error(this, message, `Are you trying to scam me?`, `You have ${balance} ONE!`)
        } else {
            await Transaction.sendGas(this, message, process.env.BOT_WALLET_ADDRESS, wallet.address, 0.01, process.env.BOT_WALLET_PRIVATE_KEY)

            await React.success(this, message)
        }

        await React.message(message, 'get_gas')
    }
}

module.exports = PingCommand