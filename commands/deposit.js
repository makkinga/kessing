const {SlashCommandBuilder}   = require('@discordjs/builders')
const {MessageEmbed}          = require("discord.js")
const {Wallet, React, Config} = require("../utils")

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
                tokensSummary += ` or ${token.symbol}`
            } else {
                tokensSummary += ` ${token.symbol},`
            }
        }

        // Send embeds
        const disclaimer = new MessageEmbed()
            .setColor(Config.get('colors.error'))
            .setTitle(`:warning: Disclaimer`)
            .setDescription(`Please do not use this as your main wallet, only for tipping on Discord. Do not deposit large amounts of ${Config.get('token.symbol')} to this wallet. Use this wallet at your own risk!`)

        const localWarning = new MessageEmbed()
            .setColor(Config.get('colors.error'))
            .setTitle(`:warning::warning: READ THIS FIRST! :warning::warning:`)
            .setDescription(`THIS BOT IS IN TEST MODE AND CONNECTED TO THE HARMONY TESTNET. PLEASE DO NOT SEND ANY MAINNET ASSETS TO THIS ADDRESS!`)

        const address = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: `Your wallet address`, iconURL: Config.get('bot.server_icon')})
            .setDescription('```' + wallet.address + '```')
            .addField(`Add funds`, `To add funds to this wallet, go to your main wallet and send some ${tokensSummary} to this address. To confirm the transaction, you can check your balance using the \`/balance\` command. Have fun tipping!`)
            .addField(`Gas`, `In order to pay network fee you need to deposit a small amount of ONE too. \n\n Don't have ONE? Don't worry, you can use the \`/get-gas\` command and get some gas on the house to get you started!`)

        await interaction.reply({embeds: process.env.ENVIRONMENT === 'local' ? [disclaimer, localWarning, address] : [disclaimer, address], ephemeral: true})
    },
}