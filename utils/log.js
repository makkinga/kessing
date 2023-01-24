/**
 * Error
 *
 * @param interaction
 * @param code
 * @param error
 */
exports.error = function (interaction, code, error) {
    const reference = `${interaction.user.id.slice(-3)}-${interaction.channelId.slice(-3)}-${interaction.id.slice(-3)}`

    const log = require('simple-node-logger').createRollingFileLogger({
        errorEventName : 'error',
        logDirectory   : `${__dirname}/../logs/`,
        fileNamePattern: 'kessing-<DATE>.log',
        dateFormat     : 'YYYY-MM-DD',
    })

    log.info({
        'user'     : interaction.user.id,
        'guild'    : interaction.guildId,
        'code'     : `E${code.toString().padStart(3, '0')}`,
        'reference': reference,
        'error'    : error,
    })

    console.error(`Error E${code.toString().padStart(3, '0')} (${reference}) by user ${interaction.user.id}:`, error)
}