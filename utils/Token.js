const axios = require('axios')

/**
 * Get ONE price
 *
 * @return {Promise<string>}
 */
exports.onePrice = async function () {
    const response = await axios({
        url   : 'https://api.binance.com/api/v3/ticker/price?symbol=ONEUSDT',
        method: 'GET',
    })

    return parseFloat(response.data.price).toFixed(6)
}

/**
 * Price in ONE
 *
 * @return {Promise<*>}
 */
exports.priceOne = async function () {
    const response = await axios({
        url   : 'https://graph.defikingdoms.com/subgraphs/name/defikingdoms/dex',
        method: 'post',
        data  : {
            query: '{pair(id: "0xeb579ddcd49a7beb3f205c9ff6006bb6390f138f") { token1Price }}'
        }
    })

    return response.data.data.pair.token1Price
}

/**
 * Price in USD
 *
 * @return {Promise<*>}
 */
exports.priceUsd = async function () {
    const priceOne = await this.priceOne()
    const onePrice = await this.onePrice()

    return onePrice * priceOne
}