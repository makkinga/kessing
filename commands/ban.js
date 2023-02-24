const {SlashCommandBuilder, EmbedBuilder, userMention, PermissionFlagsBits} = require('discord.js')
const {Account, React, Lang}                                                = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban members from tipping')
        .addUserOption(option => option.setRequired(true).setName('member').setDescription('Select a member to ban')),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        const member        = interaction.options.getUser('member')
        const address       = await Account.address(member.id)
        const memberMention = userMention(member.id)

        // Checks
        if (!await Account.canBeTipped(address)) {
            if (await Account.banned(address)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'ban.title.already_banned'), Lang.trans(interaction, 'ban.description.already_banned', {member: memberMention}), true)
            }

            return await React.error(interaction, null, Lang.trans(interaction, 'ban.title.no_active_account'), Lang.trans(interaction, 'ban.description.no_active_account', {member: memberMention}), true)
        }

        // Ban member
        await Account.ban(address)

        // Respond
        const embed = new EmbedBuilder()
            .setTitle(Lang.trans(interaction, 'ban.title.member_banned'))
            .setDescription(Lang.trans(interaction, 'ban.description.member_banned', {member: memberMention}))

        await interaction.editReply({embeds: [embed]})
    },
}