const {Command}                      = require('discord-akairo')
const table                          = require('text-table')
const {Config, BurnStatistics, Lang} = require('../utils')

class BurnStatsCommand extends Command
{
    constructor()
    {
        super('burnstats', {
            aliases  : ['burnstats', 'burnstatistics'],
            channel  : 'guild',
            ratelimit: 1,
        })
    }

    async exec(message, args)
    {
        const topTen = await BurnStatistics.getBurnersTopTen()
        const total  = await BurnStatistics.getBurnTotal()
        const author = await BurnStatistics.getUserBurnAmount(message.author.username)

        const totalRows  = [[
            total,
            Config.get('token.symbol')
        ]]
        const authorRows = [[
            message.author.username,
            author,
            Config.get('token.symbol')
        ]]
        let topTenRows   = []
        for (let i = 0; i < topTen.length; i++) {
            topTenRows.push([
                i + 1,
                topTen[i].username,
                parseFloat(topTen[i].amount).toFixed(2),
                Config.get('token.symbol'),
            ])
        }

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`🔥 ${Lang.trans(message, 'embed.title.burn_statistics')}`)
            .addField(Lang.trans(message, 'embed.title.total_burned'), '```' + table(totalRows) + '```')
            .addField(Lang.trans(message, 'embed.title.top_ten_burners'), '```' + table(topTenRows) + '```')
            .addField(Lang.trans(message, 'embed.title.you'), '```' + table(authorRows) + '```')

        await message.channel.send(embed)
    }
}

module.exports = BurnStatsCommand