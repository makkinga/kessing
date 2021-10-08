const {Command}                      = require('discord-akairo')
const table                          = require('text-table')
const {Config, TipStatistics, React} = require('../utils')

class TipstatsCommand extends Command
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
            .setTitle(`💵 Tip Statistics`)
            .addField(`Total tipped`, '```' + table(totalRows) + '```')
            .addField(`Top Ten Tippers`, '```' + table(topTenRows) + '```')
            .addField(`You`, '```' + table(authorRows) + '```')

        await message.channel.send(embed)

        await React.message(message, 'stats')
    }
}

module.exports = TipstatsCommand