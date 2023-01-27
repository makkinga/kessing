const {Account, React}                                 = require('../utils')
const {SlashCommandBuilder, EmbedBuilder, userMention} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban members from tipping')
        .setDefaultMemberPermissions(0)
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
            return await React.error(interaction, null, `Not allowed`, `${memberMention} has not been banned from tipping`, true)
        }

        // Ban member
        await Account.unban(address)

        // Respond
        const embed = new EmbedBuilder()
            .setTitle(`Member unbanned`)
            .setDescription(`${memberMention} can now send and receive tips`)

        await interaction.editReply({embeds: [embed]})
    },
}