const {EmbedBuilder} = require('discord.js')
const Lang           = require('./lang')

/**
 * Error
 *
 * @param interaction
 * @param code
 * @param title
 * @param description
 * @param edit
 * @return {Promise<void>}
 */
exports.error = async function (interaction, code, title, description = null, edit = false) {
    const reference = `${interaction.user.id.slice(-3)}-${interaction.channelId.slice(-3)}-${interaction.id.slice(-3)}`

    const embed = new EmbedBuilder()
        .setTitle(title)

    if (description !== null) {
        embed.setDescription(description)
    }

    embed.addFields(
        {name: Lang.trans(interaction, 'error.title.bug_report'), value: Lang.trans(interaction, 'error.description.bug_report', {server: 'https://discord.gg/2CUcKRzCUj'}), inline: false},
    )

    if (code) {
        embed.addFields(
            {name: `Error code`, value: `\`E${code.toString().padStart(3, '0')}\``, inline: true},
            {name: `Reference`, value: `\`${reference}\``, inline: true}
        )
    }

    if (edit) {
        await interaction.editReply({embeds: [embed], ephemeral: true})
    } else {
        await interaction.reply({embeds: [embed], ephemeral: true})
    }
}