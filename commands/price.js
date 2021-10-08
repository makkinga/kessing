const {Command}              = require('discord-akairo')
const {Config, React, Token} = require('../utils')
const table                  = require('text-table')

class ViperPriceCommand extends Command
{
    constructor()
    {
        super('price', {
            aliases  : ['price', 'stats', 'statistics'],
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        await React.processing(message)

        const usdPrice          = await Token.mochiPrice()
        let onePrice            = await Token.onePrice()
        onePrice                = usdPrice / onePrice
        const circulatingSupply = await Token.circulatingSupply()
        const totalSupply       = await Token.totalSupply()

        const rows = [
            ['ONE', `${parseFloat(onePrice).toFixed(6)} ONE`],
            ['USD', `$${parseFloat(usdPrice).toFixed(6)}`],
            null,
            ['Mkt Cap', `$${new Intl.NumberFormat().format(parseFloat(circulatingSupply * usdPrice).toFixed(6))}`],
            null,
            ['Cir Sup', `${new Intl.NumberFormat().format(parseFloat(circulatingSupply).toFixed(6))}`],
            ['Tot Sup', `${new Intl.NumberFormat().format(parseFloat(totalSupply).toFixed(6))}`],
        ]

        const tableRows = []
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] === null) {
                tableRows.push([])
            } else {
                tableRows.push([
                    rows[i][0],
                    ':',
                    rows[i][1],
                ])
            }
        }

        await React.done(message)

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(Config.get('price_embed.title'))
            .setThumbnail(Config.get('price_embed.thumbnail'))
            .setDescription('```' + table(tableRows) + '```')
            .setFooter(Config.get('price_embed.footer'))
            .addField(`Chart`, Config.get('price_embed.chart_link'))
            .setURL(Config.get('price_embed.url'))
        await message.channel.send(embed)

        await React.message(message, 'price')
    }
}

module.exports = ViperPriceCommand