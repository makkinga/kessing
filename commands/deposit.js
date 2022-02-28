const {Command}        = require('discord-akairo')
const {Config, Wallet} = require('../utils')

class DepositCommand extends Command
{
    constructor()
    {
        super('deposit', {
            aliases  : ['deposit'],
            channel  : 'dm',
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        const wallet = await Wallet.get(this, message, message.author.id)

        let tokensSummary = ''
        let i             = 1
        for (const [key, token] of Object.entries(Config.get('tokens'))) {
            if (i++ === Object.entries(Config.get('tokens')).length) {
                tokensSummary += ` or ${token.symbol}`
            } else {
                tokensSummary += ` ${token.symbol},`
            }
        }

        const warning = this.client.util.embed()
            .setColor('#e7c000')
            .setTitle(`:warning: Disclaimer`)
            .setDescription(`Please do not use this as your main wallet, only for tipping on Discord. Do not deposit large amounts of ${Config.get('token.symbol')} to this wallet. Use this wallet at your own risk!`)
        await message.author.send(warning)

        const address = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Your wallet address`)
            .setDescription('```' + wallet.address + '```')
            .addField(`Add funds`, `To add funds to this wallet, go to your main wallet and send some ${tokensSummary} to this address. To confirm the transaction, you can check your balance using the \`${Config.get('prefix')}balance\` command. Have fun tipping!`)
            .addField(`Gas`, `In order to pay network fee you need to deposit a small amount of ONE too. 1 ONE should last you 4000 transactions. \n\n Don't have 1 ONE? Don't worry, you can use the \`${Config.get('prefix')}getgas\` command and get some gas on the house to get you started!`)
        await message.author.send(address)
    }
}

module.exports = DepositCommand