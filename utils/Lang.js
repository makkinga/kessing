const Config = require('./Config')
const get    = require('lodash.get')

/**
 * Translate message
 *
 * @param interaction
 * @param key
 * @param params
 */
exports.trans = function (interaction, key, params = {}) {
    const locale = Config.get(`locales.${interaction.guildId}`) ?? 'en'

    const lang = require(`../lang/${locale}.json`)
    let string = get(lang, key)

    for (const [key, value] of Object.entries(params)) {
        string = string.replace(`:${key}`, value)
    }

    return string
}

/**
 * Translate random message
 *
 * @param interaction
 * @param key
 * @param params
 */
exports.random = function (interaction, key, params = {}) {
    const locale = Config.get(`locales.${interaction.guildId}`) ?? 'en'
    const lang   = require(`../lang/${locale}.json`)
    let array    = get(lang, key)
    let string   = array[Math.floor(Math.random() * array.length)]

    for (const [key, value] of Object.entries(params)) {
        string = string.replace(`:${key}`, value)
    }

    return string
}