const {Command}                            = require('discord-akairo')
const table                                = require('text-table')
const {Config, TipStatistics, React, Lang} = require('../utils')

class TipStatsCommand extends Command
{
    constructor()
    {
        super('tipstats', {
            aliases  : ['tipstats', 'tipstatistics'],
            ratelimit: 1,
        })
    }

    async exec(message, args)
    {
        const topTen = await TipStatistics.getTippersTopTen()
        const total  = await TipStatistics.getTipTotal()
        const author = await TipStatistics.getUserTipAmount(message.author.username)

        const totalRows  = [[
            new Intl.NumberFormat().format(total),
            Config.get('token.symbol')
        ]]
        const authorRows = [[
            message.author.username,
            new Intl.NumberFormat().format(author),
            Config.get('token.symbol')
        ]]
        let topTenRows   = []
        for (let i = 0; i < topTen.length; i++) {
            topTenRows.push([
                i + 1,
                topTen[i].username,
                new Intl.NumberFormat().format(parseFloat(topTen[i].amount).toFixed(2)),
                Config.get('token.symbol'),
            ])
        }

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`💵 ${Lang.trans(message, 'embed.title.tip_statistics')}`)
            .addField(Lang.trans(message, 'embed.title.total_tipped'), '```' + table(totalRows) + '```')
            .addField(Lang.trans(message, 'embed.title.top_ten_tippers'), '```' + table(topTenRows) + '```')
            .addField(Lang.trans(message, 'embed.title.you'), '```' + table(authorRows) + '```')

        await message.channel.send(embed)

        await React.message(message, 'stats')
    }
}

module.exports = TipStatsCommand