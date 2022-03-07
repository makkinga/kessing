const {SlashCommandBuilder} = require('@discordjs/builders')
const {Blacklist, Config}   = require('../utils')
const {MessageEmbed}        = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName(`whitelist`)
        .setDescription(`Remove member from the blacklist`)
        .addMentionableOption(option => option.setRequired(true).setName('member').setDescription(`Select the member to blacklist`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        const member = interaction.options.getMentionable('member')

        if (await Blacklist.listed(member)) {
            await Blacklist.remove(member)

            // Reply
            const embed = new MessageEmbed()
                .setColor(Config.get('colors.primary'))
                .setAuthor({name: `@${member.user.username} was successfully whitelisted`, iconURL: Config.get('bot.server_icon')})
            await interaction.editReply({embeds: [embed], ephemeral: true})
        } else {
            // Reply
            const embed = new MessageEmbed()
                .setColor(Config.get('colors.warning'))
                .setAuthor({name: `@${member.user.username} is not blacklisted`, iconURL: Config.get('bot.server_icon')})
            await interaction.editReply({embeds: [embed], ephemeral: true})
        }
    },
}