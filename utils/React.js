const Config = require('./Config')

/**
 * Success
 *
 * @param command
 * @param message
 * @param title
 * @param description
 * @return {Promise<void>}
 */
exports.success = async function (command, message, title = null, description = null) {
    await message.react('✅')
    await this.done(message)

    if (title !== null) {
        const embed = command.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(title)

        if (description !== null) {
            embed.setDescription(description)
        }

        await message.author.send(embed)
    }
}

/**
 * Error
 *
 * @param command
 * @param message
 * @param title
 * @param description
 * @return {Promise<void>}
 */
exports.error = async function (command, message, title = null, description = null) {
    await message.react('❌')
    await this.done(message)

    if (title !== null) {
        const embed = command.client.util.embed()
            .setColor(Config.get('colors.error'))
            .setTitle(title)

        if (description !== null) {
            embed.setDescription(description)
        }

        await message.author.send(embed)
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
 * Done7e6ce569cc1d4e3c2bb19400e8bbedb6
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
 * Done
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
 * @param message
 * @param type
 * @param amount
 * @return {Promise<void>}
 */
exports.message = async function (message, type, amount = null) {
    if (Math.floor(Math.random() * 20) === 1) {
        if (type === 'tip') {
            if (parseFloat(amount) >= parseFloat(Config.get('sea_creatures.dolphin.low'))) {
                type = 'large_tip'
            } else {
                type = 'small_tip'
            }
        }
        const titleArray   = await Config.get(`response.titles`)
        const messageArray = await Config.get(`response.${type}`)
        const randomTitle  = titleArray[Math.floor(Math.random() * titleArray.length)]
        let randomMessage  = messageArray[Math.floor(Math.random() * messageArray.length)]
        randomMessage      = randomMessage.replace('%title%', randomTitle)

        await message.reply(randomMessage)
    }
}