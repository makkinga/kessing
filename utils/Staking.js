const fromExponential      = require('from-exponential')
const stakingArtifact      = require('../staking-artifact.json')
const artifact             = require('../artifact.json')
const Config               = require('./Config')
const Wallet               = require('./Wallet')
const Log                  = require('./Log')
const {Harmony}            = require('@harmony-js/core')
const {ChainType, ChainID} = require('@harmony-js/utils')
const {BigNumber}          = require('bignumber.js')

/**
 * Get stakes of user
 *
 * @param address
 * @return {Promise<string>}
 */
exports.balance = async function (address) {
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')
    const balance         = await stakingContract.methods.stakes(address).call()

    return BigNumber(balance.toString()).dividedBy(Math.pow(10, Config.get(`token.decimals`))).toFixed(4)
}

/**
 * Get staking rewards of user
 *
 * @param address
 * @return {Promise<string>}
 */
exports.rewardBalance = async function (address) {
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')

    const owing    = parseInt(await stakingContract.methods.calculateEarnings(address).call())
    const recorded = parseInt(await stakingContract.methods.stakeRewards(address).call())
    const referral = parseInt(await stakingContract.methods.referralRewards(address).call())

    return BigNumber(parseFloat(owing + referral + recorded)).dividedBy(Math.pow(10, Config.get(`token.decimals`))).toFixed(4)
}

/**
 * Update status if user is staking
 *
 * @param address
 * @return {Promise<*>}
 */
exports.status = async function (address) {
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')

    return await stakingContract.methods.registered(address).call()
}

/**
 * First time user is staking, user needs to register too
 *
 * @param message
 * @param wallet
 * @param amount
 * @return {Promise<void>}
 */
exports.registerAndStake = async function (message, wallet, amount) {
    const actual          = amount * (10 ** 18)
    const arg             = fromExponential(actual)
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const gasPrice        = new hmy.utils.Unit(1).asGwei().toWei()
    const gasLimit        = '250000'
    const contract        = hmy.contracts.createContract(artifact.abi, Config.get(`token.contract_address`))
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')
    const privateKey      = await Wallet.privateKey(wallet)
    hmy.wallet.addByPrivateKey(privateKey)

    try {
        let ref = "0x0000000000000000000000000000000000000000"

        await contract.methods.approve("0x861ef0CaB3ab4a1372E7eDa936668C8967F70110", arg).send({
            from    : wallet.address,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            gas     : parseFloat((gasPrice * gasLimit) / Math.pow(10, 9))
        })
        await stakingContract.methods.registerAndStake(arg, ref).send({
            from    : wallet.address,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            gas     : parseFloat((gasPrice * gasLimit) / Math.pow(10, 9))
        })
    } catch (error) {
        Log.error(error, message)
    }
}

/**
 * Staking function if user is already staking (already registered)
 *
 * @param message
 * @param wallet
 * @param amount
 * @return {Promise<void>}
 */
exports.stake = async function (message, wallet, amount) {
    const actual          = amount * (10 ** 18)
    const arg             = fromExponential(actual)
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const gasPrice        = new hmy.utils.Unit(1).asGwei().toWei()
    const gasLimit        = '250000'
    const contract        = hmy.contracts.createContract(artifact.abi, Config.get(`token.contract_address`))
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')
    const privateKey      = await Wallet.privateKey(wallet)
    hmy.wallet.addByPrivateKey(privateKey)

    try {
        await contract.methods.approve("0x861ef0CaB3ab4a1372E7eDa936668C8967F70110", arg).send({
            from    : wallet.address,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            gas     : parseFloat((gasPrice * gasLimit) / Math.pow(10, 9))
        })
        await stakingContract.methods.stake(arg).send({
            from    : wallet.address,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            gas     : parseFloat((gasPrice * gasLimit) / Math.pow(10, 9))
        })
    } catch (error) {
        Log.error(error, message)
    }
}

/**
 * Unstake
 *
 * @param message
 * @param wallet
 * @param amount
 * @return {Promise<void>}
 */
exports.unstake = async function (message, wallet, amount) {
    const actual          = amount * (10 ** 18)
    const arg             = fromExponential(actual)
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const gasPrice        = new hmy.utils.Unit(1).asGwei().toWei()
    const gasLimit        = '250000'
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')
    const privateKey      = await Wallet.privateKey(wallet)
    hmy.wallet.addByPrivateKey(privateKey)

    try {
        await stakingContract.methods.unstake(arg).send({
            from    : wallet.address,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            gas     : parseFloat((gasLimit * gasPrice) / Math.pow(10, 9))
        })
    } catch (error) {
        Log.error(error, message)
    }
}

/**
 * Withdraw rewards
 *
 * @param message
 * @param wallet
 * @return {Promise<void>}
 */
exports.claimRewards = async function (message, wallet) {
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const gasPrice        = new hmy.utils.Unit(1).asGwei().toWei()
    const gasLimit        = '250000'
    const stakingContract = hmy.contracts.createContract(stakingArtifact.abi, '0x861ef0CaB3ab4a1372E7eDa936668C8967F70110')
    const privateKey      = await Wallet.privateKey(wallet)
    hmy.wallet.addByPrivateKey(privateKey)

    try {
        await stakingContract.methods.withdrawEarnings().send({
            from    : wallet.address,
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            gas     : parseFloat((gasPrice * gasLimit) / Math.pow(10, 9))
        })
    } catch (error) {
        Log.error(error, message)
    }
}
