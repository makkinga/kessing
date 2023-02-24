const {Account, React, Lang}                                                = require('../utils')
const {SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, userMention} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban members from tipping')
        .addUserOption(option => option.setRequired(true).setName('member').setDescription('Select a member to unban')),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        const member        = interaction.options.getUser('member')
        const address       = await Account.address(member.id)
        const memberMention = userMention(member.id)

        // Checks
        if (!await Account.banned(address)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'unban.title.not_banned'), Lang.trans(interaction, 'unban.description.not_banned', {member: memberMention}), true)
        }

        // Ban member
        await Account.unban(address)

        // Respond
        const embed = new EmbedBuilder()
            .setTitle(Lang.trans(interaction, 'unban.title.member_unbanned'))
            .setDescription(Lang.trans(interaction, 'unban.description.member_unbanned', {member: memberMention}))

        await interaction.editReply({embeds: [embed]})
    },
}