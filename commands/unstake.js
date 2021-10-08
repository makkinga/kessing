const {Command}                        = require('discord-akairo')
const {React, Wallet, Staking, Config} = require('../utils')

class UnstakeCommand extends Command
{
    constructor()
    {
        super('unstake', {
            aliases  : ['unstake'],
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
                return await React.error(this, message, `You have no staked tokens yet`, `Use the ${Config.get(`prefix`)}help command to se how to stake your ${Config.get(`token.symbol`)}`)
            }

            await Staking.unstake(message, wallet, amount)

            await React.success(this, message)
        } catch (error) {
            await React.error(this, message, `The following error has occurred`, error)
        }
    }
}

module.exports = UnstakeCommand