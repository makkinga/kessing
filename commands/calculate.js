const {SlashCommandBuilder, EmbedBuilder} = require('discord.js')
const {React, Token}                      = require('../utils')
const {ray}                               = require('node-ray')
const axios                               = require('axios')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`calculate`)
        .setDescription(`Get the value of your tokens`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount`))
        .addStringOption(option => option.setRequired(true).setName('of').setDescription(`Select a token`).addChoices(
            {name: 'CRYSTAL', value: 'CRYSTAL'},
            {name: 'JEWEL', value: 'JEWEL'},
        ))
        .addStringOption(option => option.setRequired(true).setName('in').setDescription(`Select a currency`).addChoices(
            {name: 'Dollar', value: 'usd'},
            {name: 'Euro', value: 'eur'},
        )),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        let amount     = interaction.options.getNumber('amount')
        const token    = interaction.options.getString('of')
        const currency = interaction.options.getString('in')

        // Currency symbols
        const tokenSymbols    = {
            JEWEL  : 'JEWEL',
            CRYSTAL: 'CRYSTAL',
        }
        const tokenIcons      = {
            JEWEL  : 'https://storageapi2.fleek.co/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_jewel.png',
            CRYSTAL: 'https://storageapi2.fleek.co/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_crystal.png',
        }
        const currencySymbols = {
            usd: '$:price',
            eur: '€:price',
        }

        // Get data
        let value = 0
        switch (token) {
            case 'JEWEL' :
                const jewelInfo = await Token.jewelInfo()
                value           = parseFloat(jewelInfo.priceUsd).toFixed(2)
                break
            case 'CRYSTAL' :
                const crystalInfo = await Token.crystalInfo()
                ray(crystalInfo).red()
                value = parseFloat(crystalInfo.priceUsd).toFixed(2)
                ray(value).green()
                break
        }

        switch (currency) {
            case 'eur' :
                const response  = await axios('https://api.binance.com/api/v3/ticker/price?symbol=EURBUSD')
                const euroPrice = parseFloat(response.data.price)
                value           = parseFloat(value / euroPrice).toFixed(2)

                break
        }

        value  = new Intl.NumberFormat().format(parseFloat(value * amount))
        amount = new Intl.NumberFormat().format(parseFloat(amount))

        // Reply
        const embed = new EmbedBuilder()
            .setAuthor({name: tokenSymbols[token], iconURL: tokenIcons[token]})
            .setDescription(`${amount} ${tokenSymbols[token]} ≈ ${currencySymbols[currency].replace(':price', value)}`)

        await interaction.editReply({embeds: [embed]})
    },
}

