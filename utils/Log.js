/**
 * Debug
 *
 * @return {*}
 * @param data
 * @param message
 */
exports.debug = function (data, message) {
    console.log(data)
}

/**
 * Error
 *
 * @return {*}
 * @param message
 * @param error
 */
exports.error = function (error, message) {
    const log = require('simple-node-logger').createRollingFileLogger({
        errorEventName : 'error',
        logDirectory   : `${__dirname}/../logs/`,
        fileNamePattern: 'tipbot-<DATE>.log',
        dateFormat     : 'YYYY-MM-DD',
    })

    log.info({
        'error'  : error,
        'message': message,
    })
}