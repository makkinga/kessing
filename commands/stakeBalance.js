const {Command}                        = require('discord-akairo')
const {React, Wallet, Staking, Config} = require('../utils')

class StakeBalanceCommand extends Command
{
    constructor()
    {
        super('stakebalance', {
            aliases  : ['stakebalance', 'staked'],
            channel  : 'dm',
            ratelimit: 1,
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        const wallet = await Wallet.get(this, message, message.author.id)

        if (!await Staking.status(wallet.address)) {
            await React.error(this, message, `You have no staked tokens yet`, `Use the ${Config.get(`prefix`)}help command to se how to stake your ${Config.get(`token.symbol`)}`)
        }

        const balance       = await Staking.balance(wallet.address)
        const rewardBalance = await Staking.rewardBalance(wallet.address)

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .addField(`Your staked balance`, '```' + balance + ' ' + Config.get(`token.symbol`) + '```')
            .addField(`Your reward balance`, '```' + rewardBalance + ' ' + Config.get(`token.symbol`) + '```')

        await message.author.send(embed)
    }
}

module.exports = StakeBalanceCommand