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
            {name: 'JADE', value: 'JADE'},
        ))
        .addStringOption(option => option.setRequired(true).setName('in').setDescription(`Select a currency`).addChoices(
            {name: '$', value: 'usd'},
            {name: '€', value: 'eur'},
            {name: '£', value: 'gbp'},
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
            JADE: 'JADE',
        }
        const tokenIcons      = {
            JEWEL  : 'https://storageapi2.fleek.co/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_jewel.png',
            CRYSTAL: 'https://storageapi2.fleek.co/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_crystal.png',
            JADE: 'https://storage.fleek.zone/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_jade.png',
        }
        const currencySymbols = {
            usd: '$:price',
            eur: '€:price',
            gbp: '£:price',
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
                value             = parseFloat(crystalInfo.priceUsd).toFixed(2)
                break
            case 'JADE' :
                const jadeInfo = await Token.jadeInfo()
                value             = parseFloat(jadeInfo.priceUsd).toFixed(2)
                break
        }

        switch (currency) {
            case 'eur' :
                const euroPrice = await axios(`https://api.exchangerate.host/convert?from=USD&to=EUR&amount=${value}`)
                value           = parseFloat(euroPrice.data.result).toFixed(2)

                break
            case 'gbp' :
                const gbpPrice = await axios(`https://api.exchangerate.host/convert?from=USD&to=GBP&amount=${value}`)
                value           = parseFloat(gbpPrice.data.result).toFixed(2)

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

