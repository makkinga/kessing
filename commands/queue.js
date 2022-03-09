const {SlashCommandBuilder} = require('@discordjs/builders')
const table                 = require('text-table')
const {Config, DB, Lang}    = require('../utils')
const {MessageEmbed}        = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`queue`)
        .setDescription(`Show your transaction queue`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Gather data
        const transactions = await DB.transactions.findAll({where: {author: interaction.user.id}})

        // Build table
        const rows = []
        for (let i = 0; i < transactions.length; i++) {
            const recipient = await interaction.client.users.cache.get(transactions[i].recipient)

            rows.push([
                i + 1,
                parseFloat(transactions[i].amount).toFixed(2),
                Config.get(`tokens.${transactions[i].token}.symbol`),
                `@${recipient.username}`,
                transactions[i].processing ? '⏳' : '',
            ])
        }

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: Lang.trans(interaction, 'queue.title'), iconURL: Config.get('bot.server_icon')})
            .setFooter(Lang.trans(interaction, 'queue.footer'))
        if (rows.length) {
            embed.setDescription('```' + table(rows) + '```')
        } else {
            embed.setDescription('```' + Lang.trans(interaction, 'queue.no_queue') + '```')
        }

        await interaction.editReply({embeds: [embed]})
    },
}

