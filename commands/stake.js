const {Command}                = require('discord-akairo')
const {React, Wallet, Staking} = require('../utils')

class StakeCommand extends Command
{
    constructor()
    {
        super('stake', {
            aliases  : ['stake'],
            channel  : 'dm',
            ratelimit: 1,
            args     : [
                {
                    id  : 'amount',
                    type: 'number',
                },
            ]
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        const wallet = await Wallet.get(this, message, message.author.id)
        let amount   = args.amount
        if (!amount) {
            const balance = await Wallet.balance(wallet, 'xya')
            amount        = parseFloat(balance) - 0.001
        }

        try {
            if (!await Staking.status(wallet.address)) {
                await Staking.registerAndStake(message, wallet, amount)
            } else {
                await Staking.stake(message, wallet, amount)
            }

            await React.success(this, message)
        } catch (error) {
            await React.error(this, message, `The following error has occurred`, error)
        }
    }
}

module.exports = StakeCommand