const {SlashCommandBuilder} = require('@discordjs/builders')
const {MessageEmbed}        = require('discord.js')
const {Config, Lang}        = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`help`)
        .setDescription(`Not sure where to start? Let me guide you!`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Create embeds
        const gettingStartedEmbed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: `${Config.get('bot.name')} | ${Lang.trans(interaction, 'help.title')}`, iconURL: Config.get('bot.icon')})
            .setTitle(Lang.trans(interaction, 'help.getting_started_title'))
            .setDescription(Lang.trans(interaction, 'help.getting_started_description', {bot: Config.get('bot.name'),}))
            .addField(Lang.trans(interaction, 'help.bug_reporting_title'), Lang.trans(interaction, 'help.bug_reporting_description', {user: '<@490122972124938240>'}))

        const commandsEmbed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: `${Config.get('bot.name')} | ${Lang.trans(interaction, 'help.title')}`, iconURL: Config.get('bot.icon')})
        for (let [command, data] of interaction.client.commands) {
            if (command !== 'help') {
                let options    = []
                let hasOptions = false
                let lock       = data.data.defaultPermission === false ? ':lock: ' : ''
                if (data.data.options.length) {
                    hasOptions = true
                    for (let option of data.data.options) {
                        options.push(`[${option.required ? 'required' : 'optional'}: ${option.name}]`)
                    }
                }
                command = hasOptions ? `${command} \`${options.join(' ')}\`` : `${command}`

                commandsEmbed.addField(`${lock}/${command}`, data.data.description)
            }
        }

        // Send embeds
        await interaction.editReply({embeds: [gettingStartedEmbed, commandsEmbed]})
    }
}