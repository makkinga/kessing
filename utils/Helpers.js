/**
 * Return the alias that was used
 *
 * @param message
 * @return {Promise<string>}
 */
exports.getAlias = async function (message) {
    return message.content.match(/(?<=!)([a-zA-Z]+)(?=\s|$)/)[0]
}