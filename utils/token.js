const axios = require('axios')
const {ray} = require('node-ray')

/**
 * Returns the token artifact
 *
 * @param name
 * @returns {Promise<void>}
 */
exports.artifact = async function (name) {
    return require(`../artifacts/${name}.json`)
}

/**
 * JEWEL price
 *
 * @return {Promise<*>}
 */
exports.jewelInfo = async function () {
    const response = await axios({
        url   : 'https://api.dexscreener.com/latest/dex/pairs/avalanchedfk/0xcf329b34049033de26e4449aebcb41f1992724d3',
        method: 'get',
    })

    return response.data.pair
}

/**
 * CRYSTAL price
 *
 * @return {Promise<*>}
 */
exports.crystalInfo = async function () {
    const response = await axios({
        url   : 'https://api.dexscreener.io/latest/dex/pairs/avalanchedfk/0x04dec678825b8dfd2d0d9bd83b538be3fbda2926',
        method: 'get',
    })

    return response.data.pair
}

/**
 * JADE price
 *
 * @return {Promise<*>}
 */
exports.jadeInfo = async function () {
    const response = await axios({
        url   : 'https://api.dexscreener.com/latest/dex/pairs/klaytn/0x85db3cc4bcdb8bffa073a3307d48ed97c78af0ae',
        method: 'get',
    })

    return response.data.pair
}