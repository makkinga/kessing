require('dotenv').config()
const {Harmony}                                = require('@harmony-js/core')
const {Account}                                = require('@harmony-js/account')
const {HttpProvider, Messenger}                = require('@harmony-js/network')
const {ChainType, hexToNumber, fromWei, Units} = require('@harmony-js/utils')
const {BigNumber}                              = require('bignumber.js')
const CryptoJS                                 = require('crypto-js')
const Config                                   = require('./Config')
const DB                                       = require('./DB')
const React                                    = require('./React')
const {ethers}                                 = require('ethers')

/**
 * Check wallet
 *
 * @param interaction
 * @return {Promise<boolean>}
 */
exports.check = async function (interaction) {
    const wallet = await DB.wallets.findOne({where: {user: interaction.user.id}})

    if (wallet == null) {
        await React.error(interaction, 40, `You do not have a ${Config.get('token.symbol')} Tip Bot wallet yet`, `Please run the \`/deposit\` command to create a new wallet.`, true)

        return false
    } else {
        return true
    }
}

/**
 * Get wallet
 *
 * @param interaction
 * @param id
 */
exports.get = async function (interaction, id) {
    return DB.wallets.findOne({where: {user: id}}).then(wallet => {
        if (wallet == null) {
            wallet = this.create(id)
        }

        return wallet
    }).catch(async error => {
        await Log.error(interaction, 41, error)
        return await React.error(interaction, 41, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
    })
}

/**
 * Create wallet
 *
 * @param id
 */
exports.create = function (id) {
    const account   = new Account()
    const messenger = new Messenger(
        new HttpProvider(Config.get('token.rpc_url')),
        ChainType.Harmony,
        Config.get('chain_id'),
    )
    account.setMessenger(messenger)

    return DB.wallets.create({
        user      : id,
        address   : account.address,
        privateKey: CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(account.privateKey), process.env.CYPHER_SECRET).toString(),
    })
}

/**
 * Get balance
 *
 * @param wallet
 * @param token
 */
exports.balance = async function (wallet, token) {
    const artifact   = require(`../artifacts/${process.env.ENVIRONMENT}/${token}.json`)
    const provider   = new ethers.providers.JsonRpcProvider(Config.get('rpc_url'))
    const contract   = new ethers.Contract(artifact.address, artifact.abi, provider)
    const weiBalance = await contract.balanceOf(wallet.address)
    const balance    = ethers.utils.formatEther(weiBalance)

    return parseFloat(balance).toFixed(4)
}

/**
 * Get gas balance
 *
 * @return float
 */
exports.gasBalance = async function (wallet) {
    const provider   = new ethers.providers.JsonRpcProvider(Config.get('rpc_url'))
    const weiBalance = await provider.getBalance(wallet.address)
    const balance    = ethers.utils.formatEther(weiBalance)

    return parseFloat(balance).toFixed(4)
}

/**
 * Get address
 *
 * @param id
 * @return {Promise<* | boolean>}
 */
exports.address = async function (id) {
    return DB.wallets.findOne({where: {user: id}}).then(wallet => {
        return wallet !== null ? wallet.address : false
    })
}

/**
 * Get recipient address
 *
 * @return {Promise<*>}
 * @param interaction
 * @param id
 * @param member
 */
exports.recipientAddress = async function (interaction, id, member = null) {
    let to = await this.address(id)

    if (!to) {
        const newWallet = await this.create(id)

        try {
            await member.send(`@${interaction.user.username} tipped you some ${Config.get('token.symbol')}! You don't have a wallet yet, so I have created one for you! Use the \`/help\` command to find out how to make use of my services.`)
        } catch (error) {
            console.error(error)
        }

        to = newWallet.address
    }

    return to
}

/**
 * Get private key
 *
 * @param wallet
 * @return {*}
 */
exports.privateKey = function (wallet) {
    return CryptoJS.AES.decrypt(wallet.privateKey, process.env.CYPHER_SECRET).toString(CryptoJS.enc.Utf8)
}