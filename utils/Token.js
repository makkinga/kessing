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
 * Token price
 *
 * @return {Promise<*>}
 */
exports.tokenPrice = async function () {
    const response = await axios({
        url   : 'https://api.coingecko.com/api/v3/simple/token_price/harmony-shard-0?contract_addresses=0x72Cb10C6bfA5624dD07Ef608027E366bd690048F&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true',
        method: 'get',
    })

    return response.data['0x72cb10c6bfa5624dd07ef608027e366bd690048f']
}