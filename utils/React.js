const Config         = require('./Config')
const Lang   = require('./Lang')
const {MessageEmbed} = require('discord.js')

/**
 * Success
 *
 * @param interaction
 * @param title
 * @param description
 * @param edit
 * @return {Promise<void>}
 */
exports.success = async function (interaction, title, description = null, edit = false) {
    const embed = new MessageEmbed()
        .setColor(Config.get('colors.primary'))
        .setTitle(title)

    if (description !== null) {
        embed.setDescription(description)
    }

    if (edit) {
        await interaction.editReply({embeds: [embed], ephemeral: true})
    } else {
        await interaction.reply({embeds: [embed], ephemeral: true})
    }
}

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
    const embed = new MessageEmbed()
        .setColor(Config.get('colors.error'))
        .setTitle(title)

    if (description !== null) {
        embed.setDescription(description)
    }

    if (code) {
        embed.addField(`Error code`, `E${code.toString().padStart(3, '0')}`)
    }

    if (edit) {
        await interaction.editReply({embeds: [embed], ephemeral: true})
    } else {
        await interaction.reply({embeds: [embed], ephemeral: true})
    }
}

/**
 * In progress
 *
 * @return {Promise<void>}
 */
exports.processing = async function (message) {
    await message.react('⌛')
}

/**
 * Done
 *
 * @return {Promise<void>}
 */
exports.done = async function (message) {
    const reaction = message.reactions.cache.get('⌛')

    try {
        await reaction.remove()
    } catch (error) {
        console.error('Failed to remove reaction')
    }
}

/**
 * Burn
 *
 * @return {Promise<void>}
 */
exports.burn = async function (message) {
    await message.react('🔥')
    await message.react('💀')
    await this.done(message)
}

/**
 * Sea creature
 *
 * @param message
 * @param amount
 * @return {Promise<void>}
 */
exports.seaCreature = async function (message, amount) {
    // Characters: https://unicode-table.com/en/1F1FC/

    if (parseFloat(amount) <= parseFloat(Config.get('sea_creatures.shrimp.high'))) {
        await message.react('🦐')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.crab.low')) && parseFloat(amount) <= parseFloat(Config.get('sea_creatures.crab.high'))) {
        await message.react('🦀')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.octopus.low')) && parseFloat(amount) <= parseFloat(Config.get('sea_creatures.octopus.high'))) {
        await message.react('🐙')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.fish.low')) && parseFloat(amount) <= parseFloat(Config.get('sea_creatures.fish.high'))) {
        await message.react('🐟')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.dolphin.low')) && parseFloat(amount) <= parseFloat(Config.get('sea_creatures.dolphin.high'))) {
        await message.react('🐬')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.shark.low')) && parseFloat(amount) <= parseFloat(Config.get('sea_creatures.shark.high'))) {
        await message.react('🦈')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.whale.low')) && parseFloat(amount) <= parseFloat(Config.get('sea_creatures.whale.high'))) {
        await message.react('🐳')
    }
    if (parseFloat(amount) > parseFloat(Config.get('sea_creatures.humpback.low'))) {
        await message.react('🐋')
    }
}

/**
 * Message
 *
 * @param interaction
 * @param type
 * @param amount
 * @return {Promise<void>}
 */
exports.message = async function (interaction, type, amount = null) {
    if (Math.floor(Math.random() * 10) === 1) {
        if (type === 'tip') {
            if (parseFloat(amount) >= parseFloat(Config.get('sea_creatures.dolphin.low'))) {
                type = 'large_tip'
            } else {
                type = 'small_tip'
            }
        }

        const randomTitle   = Lang.random(interaction, `response.titles`)
        const randomMessage = Lang.random(interaction, `response.${type}`, {title: randomTitle})

        await interaction.channel.send(`<@${interaction.user.id}>, ${randomMessage}`)
    }
}