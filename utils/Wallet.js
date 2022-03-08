require('dotenv').config()
const {Account}                 = require('@harmony-js/account')
const {HttpProvider, Messenger} = require('@harmony-js/network')
const {ChainType}               = require('@harmony-js/utils')
const CryptoJS                  = require('crypto-js')
const Config                    = require('./Config')
const DB                        = require('./DB')
const React                     = require('./React')
const {ethers}                  = require('ethers')
const Log                       = require('./Log')
const Lang                      = require('./Lang')

/**
 * Check wallet
 *
 * @param interaction
 * @return {Promise<boolean>}
 */
exports.check = async function (interaction) {
    const wallet = await DB.wallets.findOne({where: {user: interaction.user.id}})

    if (wallet == null) {
        await React.error(interaction, 40, Lang.trans(interaction, 'error.title.no_wallet'), Lang.trans(interaction, 'error.description.create_new_wallet'), true)

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
        return await React.error(interaction, 41, Lang.trans(interaction, 'error.title.error_occurred'), Lang.trans(interaction, 'error.description.contact_admin', {user: `<@490122972124938240>`}), true)
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
            await member.send(Lang.trans(interaction, 'error.description.tipped_without_wallet', {
                user  : interaction.user.username,
                symbol: Config.get('token.symbol'),
            }))
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