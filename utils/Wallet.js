require('dotenv').config()
const {Harmony}                                         = require('@harmony-js/core')
const {Account}                                         = require('@harmony-js/account')
const {HttpProvider, Messenger}                         = require('@harmony-js/network')
const {ChainType, ChainID, hexToNumber, fromWei, Units} = require('@harmony-js/utils')
const {BigNumber}                                       = require('bignumber.js')
const artifact                                          = require('../artifact.json')
const CryptoJS                                          = require('crypto-js')
const Config                                            = require('./Config')
const DB                                                = require('./DB')
const React                                             = require('./React')

/**
 * Check wallet
 *
 * @param command
 * @param message
 * @param id
 * @return {Promise<boolean>}
 */
exports.check = async function (command, message, id) {
    const wallet = await DB.wallets.findOne({where: {user: id}})

    if (wallet == null) {
        await React.error(command, message, `You do not have a ${Config.get('token.symbol')} Tip Bot wallet yet`, `Please run the \`${Config.get('prefix')}deposit\` command to create a new wallet.`)

        return false
    } else {
        return true
    }
}

/**
 * Get wallet
 *
 * @param command
 * @param message
 * @param id
 */
exports.get = async function (command, message, id) {
    return DB.wallets.findOne({where: {user: id}}).then(wallet => {
        if (wallet == null) {
            wallet = this.create(id)
        }

        return wallet
    }).catch(async error => {
        this.log(message, error)
        await React.error(command, message, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`)
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
    const hmy = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    
    const contract   = hmy.contracts.createContract(artifact.abi, Config.get(`tokens.${token}.contract_address`))
    const weiBalance = await contract.methods.balanceOf(wallet.address).call()

    return BigNumber(weiBalance).dividedBy(Math.pow(10, Config.get(`tokens.${token}.decimals`))).toFixed(4)
}

/**
 * Get gas balance
 *
 * @return float
 */
exports.gasBalance = async function (wallet) {
    const hmy = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )

    return hmy.blockchain
        .getBalance({address: wallet.address})
        .then((response) => {
            return parseFloat(fromWei(hexToNumber(response.result), Units.one)).toFixed(4)
        })
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
 * @param command
 * @param message
 * @param id
 * @return {Promise<*>}
 */
exports.recipientAddress = async function (command, message, id) {
    let to = await this.address(id)

    if (!to) {
        const newWallet = await this.create(id)
        const recipient = await command.client.users.cache.get(id)

        recipient.send(`@${message.author.username} tipped you some ${Config.get('token.symbol')}! You don't have a wallet yet, so I have created one for you! Use the \`${Config.get('prefix')}help\` command to find out how to make use of my services.`)

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