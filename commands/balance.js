const {SlashCommandBuilder}   = require('@discordjs/builders')
const {MessageEmbed}          = require("discord.js")
const table                   = require('text-table')
const {Wallet, React, Config} = require("../utils")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription(`Shows your balances`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 7, `No wallet`, `You have to tipping wallet yet. Please use the \`/deposit\` to create a new wallet`, true)
        }

        // Get balances and create table rows
        const wallet     = await Wallet.get(interaction, interaction.user.id)
        const balance    = await Wallet.balance(wallet, Config.get('token.default'))
        const gasBalance = await Wallet.gasBalance(wallet)

        let rows = []
        rows.push(['JEWEL', `${balance} JEWEL`])
        rows.push([])
        rows.push([`Gas`, `${gasBalance} ONE`])
        rows.push([])

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: `Your balances`, iconURL: Config.get('bot.server_icon')})
            .setDescription('```' + table(rows) + '```')

        await interaction.editReply({embeds: [embed], ephemeral: true})
    },
}