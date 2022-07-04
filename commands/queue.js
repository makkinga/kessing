const {SlashCommandBuilder} = require('@discordjs/builders')
const table                 = require('text-table')
const {Config, DB, Lang}    = require('../utils')
const {MessageEmbed}        = require('discord.js')
const moment                = require("moment")

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
        const gifts = await DB.pendingGifts.findAll({where: {author: interaction.user.id}})

        // Build tables
        const transactionRows = []
        for (let i = 0; i < transactions.length; i++) {
            const recipient = await interaction.client.users.cache.get(transactions[i].recipient)

            transactionRows.push([
                i + 1,
                parseFloat(transactions[i].amount).toFixed(2),
                Config.get(`tokens.${transactions[i].token}.symbol`),
                `@${recipient.username ?? '-'}`,
                transactions[i].processing ? '⏳' : '',
            ])
        }

        const giftRows = []
        for (let i = 0; i < gifts.length; i++) {
            giftRows.push([
                i + 1,
                moment(gifts[i].createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a'),
            ])
        }

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setAuthor({name: Lang.trans(interaction, 'queue.title'), iconURL: Config.get('bot.server_icon')})
            .setFooter({text: Lang.trans(interaction, 'queue.footer')})
        if (transactionRows.length) {
            embed.addField(Lang.trans(interaction, 'queue.transactions'), '```' + table(transactionRows) + '```')
        } else {
            embed.addField(Lang.trans(interaction, 'queue.transactions'), '```' + Lang.trans(interaction, 'queue.no_queue') + '```')
        }
        if (giftRows.length) {
            embed.addField(Lang.trans(interaction, 'queue.gifts'), '```' + table(giftRows) + '```')
        } else {
            embed.addField(Lang.trans(interaction, 'queue.gifts'), '```' + Lang.trans(interaction, 'queue.no_queue') + '```')
        }

        await interaction.editReply({embeds: [embed]})
    },
}

