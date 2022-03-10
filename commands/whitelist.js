const {SlashCommandBuilder}     = require('@discordjs/builders')
const {Blacklist, Config, Lang} = require('../utils')
const {MessageEmbed}            = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName(`whitelist`)
        .setDescription(`Add members to the whitelist`)
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
                .setAuthor({name: Lang.trans(interaction, 'whitelist.successfully_whitelisted', {user: member.user.username}), iconURL: Config.get('bot.server_icon')})
            await interaction.editReply({embeds: [embed], ephemeral: true})
        } else {
            // Reply
            const embed = new MessageEmbed()
                .setColor(Config.get('colors.warning'))
                .setAuthor({name: Lang.trans(interaction, 'whitelist.successfully_whitelisted', {user: member.user.username}), iconURL: Config.get('bot.server_icon')})
            await interaction.editReply({embeds: [embed], ephemeral: true})
        }
    },
}