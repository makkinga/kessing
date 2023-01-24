const {SlashCommandBuilder, EmbedBuilder} = require('discord.js')
const {Lang}                              = require('../utils')
const config                              = require('../config.json')
const git                                 = require('git-rev-sync')
const moment                              = require('moment')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`about`)
        .setDescription(`About this bot`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Send embed
        moment.locale(config.locales[interaction.guildId] ?? 'en')
        const embed = new EmbedBuilder()
            .setAuthor({name: `${config.bot.name} | ${Lang.trans(interaction, 'about.title')}`, iconURL: config.bot.icon})
            .setDescription(Lang.trans(interaction, 'about.description', {bot: config.bot.name, user: '<@490122972124938240>'}))
            .addFields(
                {name: Lang.trans(interaction, 'about.version'), value: git.tag(), inline: true},
                {name: Lang.trans(interaction, 'about.last_updated'), value: moment(git.date()).fromNow(), inline: true},
                {name: Lang.trans(interaction, 'about.bugs_features_title'), value: `${Lang.trans(interaction, 'about.bugs_features_description', {user: '<@490122972124938240>'})}`},
                {name: Lang.trans(interaction, 'about.coffee_title'), value: Lang.trans(interaction, 'about.coffee_description', {bot: config.bot.name}) + '```' + '0xb2689E31b229139B52006b6Ec22C991A66c9D257' + '```'},
            )

        await interaction.editReply({embeds: [embed], ephemeral: true})
    },
}