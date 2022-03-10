const {SlashCommandBuilder}         = require('@discordjs/builders')
const {MessageEmbed}                = require('discord.js')
const {Wallet, React, Config, Lang} = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription(`Shows your wallet address. If you have no wallet a new one will be created for you`),

    async execute(interaction)
    {
        // Gather data
        const wallet = await Wallet.get(interaction, interaction.user.id)

        let tokensSummary = ''
        let i             = 1
        for (const [key, token] of Object.entries(Config.get('tokens'))) {
            if (i++ === Object.entries(Config.get('tokens')).length && Object.entries(Config.get('tokens')).length !== 1) {
                tokensSummary += ` ${Lang.trans(interaction, 'or')} ${token.symbol}`
            } else {
                tokensSummary += ` ${token.symbol},`
            }
        }

        // Send embeds
        const disclaimer = new MessageEmbed()
            .setColor(Config.get('colors.error'))
            .setTitle(`:warning: ${Lang.trans(interaction, 'deposit.disclaimer_title')}`)
            .setDescription(Lang.trans(interaction, 'deposit.disclaimer_description', {symbol: Config.get('token.symbol')}))

        const localWarning = new MessageEmbed()
            .setColor(Config.get('colors.error'))
            .setTitle(`:warning::warning: READ THIS FIRST! :warning::warning:`)
            .setDescription(`THIS BOT IS IN TEST MODE AND CONNECTED TO THE HARMONY TESTNET. PLEASE DO NOT SEND ANY MAINNET ASSETS TO THIS ADDRESS!`)

        const address = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: Lang.trans(interaction, 'deposit.title'), iconURL: Config.get('bot.server_icon')})
            .setDescription('```' + wallet.address + '```')
            .addField(Lang.trans(interaction, 'deposit.add_funds_title'), Lang.trans(interaction, 'deposit.add_funds_description', {tokensSummary: tokensSummary}))
            .addField(Lang.trans(interaction, 'deposit.gas_title'), Lang.trans(interaction, 'deposit.gas_description'))

        await interaction.reply({embeds: process.env.ENVIRONMENT === 'local' ? [disclaimer, localWarning, address] : [disclaimer, address], ephemeral: true})
    },
}