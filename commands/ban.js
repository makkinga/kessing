const {SlashCommandBuilder, EmbedBuilder, userMention} = require('discord.js')
const {Account, React}                                 = require('../utils')

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
                return await React.error(interaction, null, `Already banned`, `${memberMention} has already been banned from tipping`, true)
            }

            return await React.error(interaction, null, `No active account`, `${memberMention} has no active tipping account`, true)
        }

        // Ban member
        await Account.ban(address)

        // Respond
        const embed = new EmbedBuilder()
            .setTitle(`Member banned`)
            .setDescription(`${memberMention} has been banned from sending and receiving tips`)

        await interaction.editReply({embeds: [embed]})
    },
}