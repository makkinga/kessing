const {SlashCommandBuilder}  = require('@discordjs/builders')
const {React, Token, Config} = require('../utils')
const {MessageEmbed}         = require('discord.js')
const axios                  = require("axios")

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`value`)
        .setDescription(`Get the value of your JEWEL`)
        .addNumberOption(option => option.setRequired(true).setName('of').setDescription(`Enter the amount of JEWEL`))
        .addStringOption(option => option.setRequired(false).setName('in').setDescription(`Select a currency`).addChoices([
            ['Dollar', 'usd'],
            ['Euro', 'eur'],
            ['ONE', 'one'],
        ])),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        let amount     = interaction.options.getNumber('of')
        const currency = interaction.options.getString('in') ?? 'usd'

        // Currency symbols
        const symbols = {
            usd: '$:price',
            eur: '€:price',
            one: ':price ONE',
        }

        // Get data
        const {usd} = await Token.tokenPrice()
        let value   = parseFloat(usd).toFixed(2)

        switch (currency) {
            case 'eur' :
                const eur = await Token.tokenPriceInEuro(usd)
                value      = parseFloat(eur).toFixed(2)
                break
            case 'one' :
                const onePrice = await Token.onePrice()
                const one      = usd / onePrice
                value          = parseFloat(one).toFixed(2)
                break
        }

        value  = new Intl.NumberFormat().format(parseFloat(value * amount))
        amount = new Intl.NumberFormat().format(parseFloat(amount))

        // Reply
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setDescription(`${amount} JEWEL = ${symbols[currency].replace(':price', value)}`)

        await interaction.editReply({embeds: [embed]})
    },
}

