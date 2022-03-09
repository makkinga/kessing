const {SlashCommandBuilder}     = require('@discordjs/builders')
const {Blacklist, Config, Lang} = require('../utils')
const {MessageEmbed}            = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName(`blacklist`)
        .setDescription(`Add members to the blacklist`)
        .addMentionableOption(option => option.setRequired(true).setName('member').setDescription(`Select the member to blacklist`))
        .addNumberOption(option => option.setRequired(true).setName('duration').setDescription(`Select the duration of the blacklisting`).addChoices([
            ['Forever', 0],
            ['30 minutes', 1800],
            ['1 hour', 3600],
            ['5 hours', 18000],
            ['1 day', 86400],
            ['1 week', 604800],
            ['1 month', 2628000],
            ['1 year', 31556926],
        ])),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        const member   = interaction.options.getMentionable('member')
        const duration = interaction.options.getNumber('duration')

        if (!await Blacklist.listed(member)) {
            const forever = duration === 0
            await Blacklist.add(member, forever, forever ? null : duration)

            // Reply
            const embed = new MessageEmbed()
                .setColor(Config.get('colors.primary'))
                .setAuthor({name: Lang.trans(interaction, 'blacklist.successfully_blacklisted', {user: member.user.username}), iconURL: Config.get('bot.server_icon')})
            await interaction.editReply({embeds: [embed], ephemeral: true})
        } else {
            // Reply
            const embed = new MessageEmbed()
                .setColor(Config.get('colors.warning'))
                .setAuthor({name: Lang.trans(interaction, 'blacklist.already_blacklisted', {user: member.user.username}), iconURL: Config.get('bot.server_icon')})
            await interaction.editReply({embeds: [embed], ephemeral: true})
        }
    },
}