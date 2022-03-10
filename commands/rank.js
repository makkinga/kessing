const {SlashCommandBuilder} = require('@discordjs/builders')
const table                 = require('text-table')
const {Config, DB, Lang}    = require('../utils')
const {MessageEmbed}        = require('discord.js')
const {Sequelize}           = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setDefaultPermission(false)
        .setName(`rank`)
        .setDescription(`Display the message top ranking`)
        .addStringOption(option => option.setRequired(true).setName('listing').setDescription(`Select a server`).addChoices([
            ['This server', 'server'],
            ['Total', 'total'],
        ]))
        .addNumberOption(option => option.setRequired(true).setName('length').setDescription(`Select the list length`).addChoices([
            ['Top 5', 5],
            ['Top 10', 10],
            ['Top 25', 25],
            ['Top 50', 50],
        ])),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const listing = interaction.options.getString('listing')
        const length  = interaction.options.getNumber('length')

        // Gather data
        const top = await DB.messageCount.findAll({
            order: [[Sequelize.col('count'), 'DESC']],
            where: {
                guild: interaction.guild.id,
            },
            limit: length,
        })

        // Build tables
        let topRows = []
        if (listing === 'total') {
            const topTotal = await DB.messageCount.findAll({
                order     : [[Sequelize.col('count'), 'DESC']],
                group     : ['user'],
                attributes: ['user', [Sequelize.fn('sum', Sequelize.col('count')), 'total_count']],
                limit     : length,
                raw       : true
            })

            for (let i = 0; i < topTotal.length; i++) {
                let position = i + 1

                topRows.push([
                    position,
                    await interaction.client.users.cache.get(topTotal[i].user).username,
                    `${topTotal[i].total_count} msg`,
                ])
            }
        } else {
            for (let i = 0; i < top.length; i++) {
                let position = i + 1

                topRows.push([
                    position,
                    await interaction.client.users.cache.get(top[i].user).username,
                    `${top[i].count} msg`,
                ])
            }
        }

        // Send embed
        const listingName = listing === 'total' ? Lang.trans(interaction, 'rank.total') : Lang.trans(interaction, 'rank.this_server')
        const embed       = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: Lang.trans(interaction, 'rank.title', {length: length, listing: listingName}), iconURL: Config.get('bot.server_icon')})
            .setDescription('```' + table(topRows) + '```')

        await interaction.editReply({embeds: [embed]})
    },
}

