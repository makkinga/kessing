const {Command}                = require('discord-akairo')
const {React, Wallet, Staking} = require('../utils')

class ClaimCommand extends Command
{
    constructor()
    {
        super('claim', {
            aliases  : ['claim'],
            channel  : 'dm',
            ratelimit: 1
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        const wallet        = await Wallet.get(this, message, message.author.id)
        const rewardBalance = await Staking.rewardBalance(wallet.address)

        if (!rewardBalance) {
            await React.error(this, message, `You have not earned any rewards yet`, `Rewards are handed out every 24h after you first register. Please be patient`)
        }

        try {
            await Staking.claimRewards(message, wallet)

            await React.success(this, message)
        } catch (error) {
            await React.error(this, message, `The following error has occurred`, error)
        }
    }
}

module.exports = ClaimCommand