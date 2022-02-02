const {SlashCommandBuilder} = require('@discordjs/builders')
const {DB, Config}          = require('../utils')
const moment                = require("moment")
const {MessageEmbed}        = require("discord.js")
const Log                   = require("../utils/Log")
const React                 = require("../utils/React")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind-me')
        .setDescription(`Set a reminder for later`)
        .addNumberOption(option => option.setRequired(true).setName('in').setDescription(`When should I remind you?`).addChoices([
            ['1 minute', 60],
            ['30 minutes', 1800],
            ['1 hour', 3600],
            ['2 hours', 7200],
            ['3 hours', 10800],
            ['4 hours', 14400],
            ['5 hours', 18000],
            ['1 day', 86400],
            ['1 week', 604800],
            ['1 month', 2628000],
            ['1 year', 31556926],
        ]))
        .addStringOption(option => option.setRequired(true).setName('about').setDescription(`What should I remind you of?`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        const time    = interaction.options.getNumber('in')
        const message = interaction.options.getString('about')

        // Calculations
        const timestamp     = moment().unix() + time
        const formattedDate = moment.unix(timestamp).utc().format('DD-MM-YYYY h:mm A') + ' (UTC)'

        // Insert into database
        await DB.reminders.create({
            user     : interaction.user.id,
            channel  : interaction.channel.id,
            timestamp: timestamp,
            message  : message,
        }).catch(async error => {
            Log.error(error)
            await React.error(interaction, 24, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
        })

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setThumbnail(Config.get('token.thumbnail'))
            .setTitle(`I will remind you on ${formattedDate} about`)
            .setDescription(message)

        await interaction.editReply({embeds: [embed]})
    },
}