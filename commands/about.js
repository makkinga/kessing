const {SlashCommandBuilder} = require('@discordjs/builders')
const {MessageEmbed}        = require('discord.js')
const {Config}              = require('../utils')
const git                   = require('git-rev-sync')
const moment                = require('moment')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`about`)
        .setDescription(`About this bot`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: `${Config.get('bot.name')} | About`, iconURL: Config.get('bot.icon')})
            .setDescription(`${Config.get('bot.name')} was built with :heart: by <@490122972124938240> for the DeFi Kingdoms Discord community. Please feel free to send me feature requests, bug reports, or other questions and suggestions!`)
            .addField(`Version`, git.tag(), true)
            .addField(`Last updated`, moment(git.date()).fromNow(), true)
            .addField(`Licence`, 'MIT', true)
            .addField(`Source`, `https://github.com/makkinga/dfk-tipbot`)
            .addField(`Buy me a coffee`, `Enjoy ${Config.get('bot.name')}? Consider buying me a coffee` + '```' + '0xb2689E31b229139B52006b6Ec22C991A66c9D257' + '```')
            .addField(`Contributors`, `<@221734683417772042>, <@891355078416543774>`)

        await interaction.editReply({embeds: [embed], ephemeral: true})
    },
}