const {SlashCommandBuilder}        = require('@discordjs/builders')
const {React, Token, Config, Lang} = require('../utils')
const {MessageEmbed}               = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`calculate`)
    .setDescription(`Get the value of your tokens`)
    .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount`))
    .addStringOption(option => option.setRequired(true).setName('of').setDescription(`Select a token`).addChoices([
      ['JEWEL', 'jewel'],
      ['CRYSTAL', 'crystal'],
    ]))
    .addStringOption(option => option.setRequired(true).setName('in').setDescription(`Select a currency`).addChoices([
      ['Dollar', 'usd'],
      ['Euro', 'eur'],
      ['ONE', 'one'],
    ])),

  async execute(interaction)
  {
    // Defer reply
    await interaction.deferReply({ephemeral: true})

    // Options
    let amount     = interaction.options.getNumber('amount')
    const token    = interaction.options.getString('of')
    const currency = interaction.options.getString('in')

    // Currency symbols
    const tokenSymbols = {
      jewel: 'JEWEL',
      crystal: 'CRYSTAL',
    }
    const tokenIcons = {
      jewel: 'https://storageapi2.fleek.co/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_jewel.png',
      crystal: 'https://storageapi2.fleek.co/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/logo_crystal.png',
    }
    const currencySymbols = {
      usd: '$:price',
      eur: '€:price',
      one: ':price ONE',
    }

    // Get data
    const {usd} = await Token.tokenPrice()
    let value   = 0
    switch (token) {
      case 'jewel' :
        value = parseFloat(usd).toFixed(2)
        break
      case 'crystal' :
        const crystalInJewel = await Token.crystalPrice()
        value                = parseFloat(usd * crystalInJewel).toFixed(2)
        break
    }

    switch (currency) {
      case 'eur' :
        const eur = await Token.tokenPriceInEuro(usd)
        value     = parseFloat(eur).toFixed(2)
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
      .setAuthor({name: tokenSymbols[token], iconURL: tokenIcons[token]})
      .setDescription(`${amount} ${tokenSymbols[token]} ≈ ${currencySymbols[currency].replace(':price', value)}`)

    await interaction.editReply({embeds: [embed]})
  },
}

