const bankArtifact = require('../artifacts/bank.json')
const dotenv       = require('dotenv')
const {ethers}     = require('ethers')
dotenv.config()

// Ethers
const provider     = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const signer       = new ethers.Wallet(process.env.BOT_PKEY, provider)
const bankContract = new ethers.Contract(bankArtifact.address, bankArtifact.abi, provider)
const bank         = bankContract.connect(signer)

/**
 * Returns the account's address
 *
 * @returns {Promise<boolean>}
 * @param discordId
 */
exports.address = async function (discordId) {
    return await bank.getAccountByDiscordId(discordId)
}

/**
 * Returns whether the account can be tipped or not
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.canBeTipped = async function (address) {
    return await bank.getAccountCanBeTipped(address)
}

/**
 * Returns whether the account can tip or not
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.canTip = async function (address) {
    return await bank.getAccountCanTip(address)
}

/**
 * Returns whether the account is active
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.active = async function (address) {
    return await bank.getAccountActive(address)
}

/**
 * Returns whether the account is verified
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.verified = async function (address) {
    return await bank.getAccountVerified(address)
}

/**
 * Verify an account
 *
 * @returns {Promise<boolean>}
 * @param address
 * @param id
 */
exports.verify = async function (address, id) {
    return await bank.verifyAccount(address, id)
}

/**
 * Returns whether the account is banned
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.banned = async function (address) {
    return await bank.getAccountBanned(address)
}

/**
 * Ban account
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.ban = async function (address) {
    return await bank.banAccount(address)
}

/**
 * Unban account
 *
 * @returns {Promise<boolean>}
 * @param address
 */
exports.unban = async function (address) {
    return await bank.unbanAccount(address)
}

/**
 * Returns whether the account has enough balance
 *
 * @returns {Promise<boolean>}
 * @param address
 * @param amount
 * @param token
 */
exports.hasBalance = async function (address, amount, token) {
    return parseFloat(ethers.utils.formatEther(await bank.getAccountBalance(address, token))) >= amount
}

/**
 * Returns the account's balance
 *
 * @returns {Promise<string>}
 * @param address
 * @param token
 */
exports.balance = async function (address, token) {
    return parseFloat(ethers.utils.formatEther(await bank.getAccountBalance(address, token))).toFixed(4)
}

/**
 * Returns the account's tipped balance
 *
 * @returns {Promise<string>}
 * @param address
 * @param token
 */
exports.tipped = async function (address, token) {
    return parseFloat(ethers.utils.formatEther(await bank.getAccountTipped(address, token))).toFixed(4)
}

/**
 * Returns the account's received balance
 *
 * @returns {Promise<string>}
 * @param address
 * @param token
 */
exports.received = async function (address, token) {
    return parseFloat(ethers.utils.formatEther(await bank.getAccountReceived(address, token))).toFixed(4)
}

/**
 * Returns the account's burned balance
 *
 * @returns {Promise<string>}
 * @param address
 * @param token
 */
exports.burned = async function (address, token) {
    return parseFloat(ethers.utils.formatEther(await bank.getAccountBurned(address, token))).toFixed(4)
}