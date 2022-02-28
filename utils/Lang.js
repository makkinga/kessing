const Config = require('./Config')
const get    = require('lodash.get')

/**
 * Translate message
 *
 * @param message
 * @param key
 * @param params
 */
exports.trans = function (message, key, params = {}) {
    const locale = message.channel.type !== 'dm' ? Config.get(`locales.${message.guild.id}`) : 'en'
    const lang   = require(`../lang/${locale}.json`)
    let string   = get(lang, key)

    for (const [key, value] of Object.entries(params)) {
        string = string.replace(`:${key}`, value)
    }

    return string
}

/**
 * Translate random message
 *
 * @param message
 * @param key
 * @param params
 */
exports.random = function (message, key, params = {}) {
    const locale = message.channel.type !== 'dm' ? Config.get(`locales.${message.guild.id}`) : 'en'
    const lang   = require(`../lang/${locale}.json`)
    let array    = get(lang, key)
    let string   = array[Math.floor(Math.random() * array.length)]

    for (const [key, value] of Object.entries(params)) {
        string = string.replace(`:${key}`, value)
    }

    return string
}