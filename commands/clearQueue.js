const {SlashCommandBuilder}     = require('@discordjs/builders')
const {Config, DB, React, Lang} = require('../utils')
const {MessageEmbed}            = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`clear-queue`)
        .setDescription(`Clear your transaction queue`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Checks
        const transactions = await DB.transactions.count({where: {author: interaction.user.id}})
        const gifts = await DB.pendingGifts.count({where: {author: interaction.user.id}})
        const hasQueue = transactions > 0 || gifts > 0

        if (!hasQueue) {
            return await React.error(interaction, null, Lang.trans(interaction, 'queue.nothing_to_clear_title'), Lang.trans(interaction, 'queue.nothing_to_clear_description'), true)
        }

        // Destroy data
        await DB.transactions.destroy({where: {author: interaction.user.id}})
        await DB.pendingGifts.destroy({where: {author: interaction.user.id}})

        // Send embed
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setDescription(Lang.trans(interaction, 'queue.cleared_successfully'))

        await interaction.editReply({embeds: [embed]})
    },
}

