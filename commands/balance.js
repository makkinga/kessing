const {SlashCommandBuilder}         = require('@discordjs/builders')
const {MessageEmbed}                = require('discord.js')
const table                         = require('text-table')
const {Wallet, React, Config, Lang} = require('../utils')

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
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.no_wallet'), Lang.trans(interaction, 'error.description.create_new_wallet'), true)
        }

        // Get balances and create table rows
        const wallet     = await Wallet.get(interaction, interaction.user.id)
        const balance    = await Wallet.balance(wallet, Config.get('token.default'))
        const gasBalance = await Wallet.gasBalance(wallet)

        let rows = []
        rows.push(['JEWEL', `${balance} JEWEL`])
        rows.push([])
        rows.push([Lang.trans(interaction, 'balance.gas'), `${gasBalance} ONE`])
        rows.push([])

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: Lang.trans(interaction, 'balance.title'), iconURL: Config.get('bot.server_icon')})
            .setDescription('```' + table(rows) + '```')

        await interaction.editReply({embeds: [embed], ephemeral: true})
    },
}