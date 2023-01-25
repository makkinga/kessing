const config                                                 = require('../config.json')
const {React, Token, Lang}                                   = require('../utils')
const table                                                  = require('text-table')
const moment                                                 = require('moment')
const {SlashCommandBuilder, EmbedBuilder, AttachmentBuilder} = require('discord.js')
const puppeteer                                              = require('puppeteer')
const {promises: fs}                                         = require('fs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`statistics`)
        .setDescription(`Displays token statistics`)
        .addStringOption(option => option.setRequired(false).setName('token').setDescription(`Select a token`).addChoices(
            {name: 'CRYSTAL', value: 'CRYSTAL'},
            {name: 'JEWEL', value: 'JEWEL'},
            {name: 'JADE', value: 'JADE'},
        )),

    async execute(interaction)
    {
        // Options
        const selectedToken = interaction.options.getString('token')

        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Gather data
        const jewelInfo   = await Token.jewelInfo()
        const crystalInfo = await Token.crystalInfo()
        const jadeInfo    = await Token.jadeInfo()
        const tokens      = {
            'JEWEL'  : {
                usd : parseFloat(jewelInfo.priceUsd).toFixed(3),
                data: jewelInfo
            },
            'CRYSTAL': {
                usd : parseFloat(crystalInfo.priceUsd).toFixed(3),
                data: crystalInfo
            },
            'JADE'   : {
                usd : parseFloat(jadeInfo.priceUsd).toFixed(3),
                data: jadeInfo
            }
        }

        const fields = []
        let file, fileName, filePath

        if (!selectedToken) {
            for (const [symbol, token] of Object.entries(tokens)) {
                const tokenTableRows = []

                tokenTableRows.push(
                    ['.', '.', Lang.trans(interaction, 'statistics.1h'), '.', Lang.trans(interaction, 'statistics.24h')],
                    [Lang.trans(interaction, 'statistics.price_change'), '|', `${parseFloat(token.data.priceChange.h1).toFixed(2)}%`, '|', `${parseFloat(token.data.priceChange.h24).toFixed(2)}%`],
                    [Lang.trans(interaction, 'statistics.buys'), '|', token.data.txns.h1.buys, '|', token.data.txns.h24.buys],
                    [Lang.trans(interaction, 'statistics.sells'), '|', token.data.txns.h1.sells, '|', token.data.txns.h24.sells],
                    [
                        Lang.trans(interaction, 'statistics.volume'),
                        '|',
                        `$${new Intl.NumberFormat().format(parseFloat(token.data.volume.h1).toFixed(0))}`,
                        '|',
                        `$${new Intl.NumberFormat().format(parseFloat(token.data.volume.h24).toFixed(0))}`
                    ],
                )

                const arrow = (token.data.priceChange.h1 > 0 ? `↗️` : `↘️`)

                fields.push(
                    {name: `${arrow} ${symbol} $${token.usd}`, value: '```' + table(tokenTableRows) + '``` ' + `[${Lang.trans(interaction, 'statistics.chart_link_label', {symbol: symbol})}](${token.data.url} '${Lang.trans(interaction, 'statistics.chart_link_title', {symbol: symbol})}')`}
                )
            }
        } else {
            const tokenTableRows = []

            const token = tokens[selectedToken]

            tokenTableRows.push(
                ['.', '.', Lang.trans(interaction, 'statistics.1h'), '.', Lang.trans(interaction, 'statistics.24h')],
                [Lang.trans(interaction, 'statistics.price_change'), '|', `${parseFloat(token.data.priceChange.h1).toFixed(2)}%`, '|', `${parseFloat(token.data.priceChange.h24).toFixed(2)}%`],
                [Lang.trans(interaction, 'statistics.buys'), '|', token.data.txns.h1.buys, '|', token.data.txns.h24.buys],
                [Lang.trans(interaction, 'statistics.sells'), '|', token.data.txns.h1.sells, '|', token.data.txns.h24.sells],
                [
                    Lang.trans(interaction, 'statistics.volume'),
                    '|',
                    `$${new Intl.NumberFormat().format(parseFloat(token.data.volume.h1).toFixed(0))}`,
                    '|',
                    `$${new Intl.NumberFormat().format(parseFloat(token.data.volume.h24).toFixed(0))}`
                ],
            )

            const arrow = (token.data.priceChange.h1 > 0 ? `↗️` : `↘️`)

            fields.push({name: `${arrow} ${selectedToken} $${token.usd}`, value: '```' + table(tokenTableRows) + '```'})

            // Make screenshot of the chart
            const url        = `${token.data.url}?embed=1&trades=0&info=0`
            // const url        = 'https://dexscreener.com/bsc/0x0f8e31ce605f225c336dead35304d649ae8fad04?embed=1&trades=0&info=0'
            fileName         = `${moment().unix()}.png`
            filePath         = `chartscreens/${fileName}`
            const Screenshot = async () => {
                const browser = await puppeteer.launch({
                    headless: true,
                    args    : ['--no-sandbox', '--disable-setuid-sandbox'],
                })
                const page    = await browser.newPage()
                await page.goto(url)
                await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36')

                const elementHandle = await page.waitForSelector('div#tv-chart-container iframe')
                const frame         = await elementHandle.contentFrame()

                await frame.waitForSelector('div[data-value="240"]', {visible: true})
                await frame.click('div[data-value="240"]')
                await frame.click('div[data-value="candle"]')

                await frame.waitForFunction('document.querySelector(\'div[class*="intervalTitle"]\').textContent === \'4h\'')

                await page.setViewport({
                    width : 1355,
                    height: 740,
                })
                await page.screenshot({
                    path: filePath,
                    clip: {x: 55, y: 40, width: 1300, height: 700}
                })
                await page.close()
                await browser.close()
            }

            await Screenshot()

            const buffer = await fs.readFile(filePath)
            file         = new AttachmentBuilder(buffer, {name: fileName})
        }

        const embed = new EmbedBuilder()
            .setFields(fields)
            .setTimestamp()
            .setFooter({text: Lang.trans(interaction, 'statistics.footer'), iconURL: 'https://dexscreener.com/favicon.png'})

        if (selectedToken) {
            await embed.setImage(`attachment://${fileName}`)

            await interaction.editReply({embeds: [embed], files: [file]})

            await fs.unlink(filePath)
        } else {
            await interaction.editReply({embeds: [embed]})
        }
    },
}