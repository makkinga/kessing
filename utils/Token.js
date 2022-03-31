const {Harmony}   = require('@harmony-js/core')
const {ChainType} = require('@harmony-js/utils')
const {BigNumber} = require('bignumber.js')
const artifact    = require(`../artifacts/${process.env.ENVIRONMENT}/jewel.json`)
const axios       = require('axios')
const Config      = require('./Config')

/**
 * Get Viper info
 *
 * @return {Promise<RTCIceCandidatePair>}
 */
exports.viperInfo = async function () {
    const response = await axios({
        url   : 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap',
        method: 'post',
        data  : {
            query: `
                {         
                    pair(id: "${Config.get('token.viper_pair_id')}") { 
                    token0 {
                        id
                        symbol
                        name
                    } 
                        token0Price
                        token1Price
                        volumeUSD
                        txCount
                    }
                }
            `
        }
    })

    return response.data.data.pair
}

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
 * Get volume
 *
 * @return {Promise<string>}
 */
exports.volume = async function () {
    const response = await axios({
        url   : 'https://graph.viper.exchange/subgraphs/name/venomprotocol/venomswap',
        method: 'post',
        data  : {
            query: `
                {
                  tokenDayDatas(first: 1, orderBy: date, orderDirection: desc, where: {token: "0x9b68bf4bf89c115c721105eaf6bd5164afcc51e4"}) {
                    date
                    priceUSD
                    totalLiquidityUSD
                    dailyVolumeUSD
                  }
                }
            `
        }
    })

    return parseFloat(response.data.data.tokenDayDatas[0].dailyVolumeUSD).toFixed(6)
}

/**
 * Get circulating supply
 *
 * @return {Promise<number>}
 */
exports.circulatingSupply = async function () {
    const walletsToCheck = [
        '0x28d9475f6354091a49e20a897f6405a02ffd6836',
        '0x328983c8331a8ad6f08036f2983a8268f9e0f46d',
        '0xfef8bd2e06d8117e51ce7b960992e4055997d9fe',
        '0x194e7650fe17c2c478cd6d147620790c9e811c3f',
        '0x038eb501cef9d37e1a418ba28f66bd535123a6e7',
        '0x2b9f62ac65bcf956b6e15ec427456b2cf3a51992',
        '0x000000000000000000000000000000000000dead',
        '0x48a30b33ebd0afac1d8023e06e17372c21c0fb18',
        '0x9b68bf4bf89c115c721105eaf6bd5164afcc51e4',
        '0xbb4972a578266e0800d98f4248d057d6f6cde2bf',
        '0x0fac0cE62af67E6DB9cEb623aBB1De9943EDF79a'
    ]

    let circulatingSupply = 450000000

    const hmy      = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const contract = hmy.contracts.createContract(artifact.abi, Config.get('token.contract_address'))

    for (let i = 0; i < walletsToCheck.length; i++) {
        const balance = await contract.methods.balanceOf(walletsToCheck[i]).call()
        circulatingSupply -= parseInt(balance) / 1000000000000000000
    }

    return circulatingSupply - await this.rewardPool()
}

/**
 * Get staked supply
 *
 * @return {Promise<string>}
 */
exports.stakedSupply = async function () {
    const hmy         = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const contract    = hmy.contracts.createContract(stakingArtifact.abi, stakingArtifact.address)
    const totalStaked = await contract.methods.totalStaked().call()

    return BigNumber(totalStaked.toString()).dividedBy(Math.pow(10, Config.get(`token.decimals`))).toFixed(4)
}

/**
 * Get staking rewards
 *
 * @return {Promise<number>}
 */
exports.rewardPool = async function () {
    const hmy          = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const contract     = hmy.contracts.createContract(artifact.abi, Config.get('token.contract_address'))
    let stakingBalance = await contract.methods.balanceOf(stakingArtifact.address).call()

    stakingBalance     = BigNumber(stakingBalance.toString()).dividedBy(Math.pow(10, Config.get(`token.decimals`))).toFixed(4)
    const stakedSupply = await this.stakedSupply()

    return parseFloat(stakingBalance) - parseFloat(stakedSupply)
}

/**
 * Get total supply
 *
 * @return {Promise<number>}
 */
exports.totalSupply = async function () {
    const burnt = [
        '0x000000000000000000000000000000000000dead',
        '0x9b68bf4bf89c115c721105eaf6bd5164afcc51e4'
    ]

    let totalSupply = 450000000

    const hmy      = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const contract = hmy.contracts.createContract(artifact.abi, Config.get('token.contract_address'))

    for (let i = 0; i < burnt.length; i++) {
        const balance = await contract.methods.balanceOf(burnt[i]).call()
        totalSupply -= parseInt(balance) / 1000000000000000000
    }

    return totalSupply
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

/**
 * Crystal price
 *
 * @return {Promise<*>}
 */
exports.crystalPrice = async function () {
    const response = await axios({
        url   : 'https://api.dexscreener.io/latest/dex/pairs/avalanchedfk/0x48658e69d741024b4686c8f7b236d3f1d291f386',
        method: 'get',
    })

    return response.data.pair.priceNative
}

/**
 * Token price in Euro
 */
exports.tokenPriceInEuro = async function (usdPrice) {
    const response  = await axios('https://api.binance.com/api/v3/ticker/price?symbol=EURBUSD')
    const euroPrice = parseFloat(response.data.price)

    return parseFloat(usdPrice / euroPrice).toFixed(6)
}