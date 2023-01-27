const tipperArtifact              = require('../artifacts/tipper.json')
const dotenv                      = require('dotenv')
const {ethers}                    = require('ethers')
const getRevertReason             = require('eth-revert-reason')
const {EmbedBuilder, userMention} = require('discord.js')
const Token                       = require('./token')
const config                      = require('../config.json')
const {IncomingWebhook}           = require('@slack/webhook')
const webhook                     = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
const {ray}                       = require('node-ray')
dotenv.config()

/**
 * Check gas balance
 *
 * @param provider
 * @param signer
 * @returns {Promise<void>}
 */
async function checkGas(provider, signer)
{
    let balance = await provider.getBalance(signer.address)
    balance     = ethers.utils.formatEther(balance)
    if (balance < 10) {
        await webhook.send({
            text: `Help <@U039W35R943>! I\'m running low on gas here! Only ${parseFloat(balance).toFixed(2)} JEWEL left before I completely run out!`,
        })
    }
}

/**
 * Make a single transaction
 *
 * @param interaction
 * @param member
 * @param from
 * @param to
 * @param token
 * @param amount
 * @returns {Promise<void>}
 */
exports.make = async function (interaction, member, from, to, token, amount) {
    const provider       = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const options        = {gasPrice: await provider.getGasPrice(), gasLimit: 300000}
    const signer         = new ethers.Wallet(process.env.BOT_PKEY, provider)
    const tipperContract = new ethers.Contract(tipperArtifact.address, tipperArtifact.abi, provider)
    const tipper         = tipperContract.connect(signer)
    const artifact       = await Token.artifact(token)

    await checkGas(provider, signer)

    try {
        const transaction = await tipper.tip(
            from,
            to,
            ethers.utils.parseEther(amount.toString()),
            artifact.address,
            options
        )

        await transaction.wait(1)
    } catch (error) {
        console.log(error) // REMOVE
        console.log(await getRevertReason(error.transaction.hash)) // REMOVE
    }

    const toNotification = new EmbedBuilder()
        .setTitle(`You got tipped!`)
        .setDescription(`@${interaction.user.username} tipped you ${amount} ${artifact.name} in <#${interaction.channel.id}>`)
        .setTimestamp()

    const embed = new EmbedBuilder()
        .setAuthor({name: `@${interaction.user.username} tipped @${member.username} ${amount} ${artifact.name}`, iconURL: config.token_icons[artifact.name]})

    await interaction.editReply({embeds: [embed]})

    await member.send({embeds: [toNotification]})
}

/**
 * Split a transaction
 *
 * @param interaction
 * @param members
 * @param from
 * @param to
 * @param token
 * @param amount
 * @returns {Promise<void>}
 */
exports.split = async function (interaction, members, from, to, token, amount) {
    const provider       = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const options        = {gasPrice: await provider.getGasPrice(), gasLimit: 300000}
    const signer         = new ethers.Wallet(process.env.BOT_PKEY, provider)
    const tipperContract = new ethers.Contract(tipperArtifact.address, tipperArtifact.abi, provider)
    const tipper         = tipperContract.connect(signer)
    const artifact       = await Token.artifact(token)

    try {
        const transaction = await tipper.tipSplit(
            from,
            to,
            ethers.utils.parseEther(amount.toString()),
            artifact.address,
            options
        )

        await transaction.wait(1)
    } catch (error) {
        console.log(error) // REMOVE
        console.log(await getRevertReason(error.transaction.hash)) // REMOVE
    }

    const rained = artifact.name === 'CRYSTAL' ? 'snowed' : 'rained'
    const embed  = new EmbedBuilder()
        .setAuthor({name: `@${interaction.user.username} ${rained} ${amount} ${artifact.name}`, iconURL: config.token_icons[artifact.name]})

    await interaction.editReply({embeds: [embed]})
}

/**
 * Make a single transaction
 *
 * @param interaction
 * @param from
 * @param token
 * @param amount
 * @returns {Promise<void>}
 */
exports.burn = async function (interaction, from, token, amount) {
    const provider       = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const options        = {gasPrice: await provider.getGasPrice(), gasLimit: 300000}
    const signer         = new ethers.Wallet(process.env.BOT_PKEY, provider)
    const tipperContract = new ethers.Contract(tipperArtifact.address, tipperArtifact.abi, provider)
    const tipper         = tipperContract.connect(signer)
    const artifact       = await Token.artifact(token)

    try {
        const transaction = await tipper.burn(
            from,
            ethers.utils.parseEther(amount.toString()),
            artifact.address,
            options
        )

        await transaction.wait(1)
    } catch (error) {
        console.log(error) // REMOVE
        console.log(await getRevertReason(error.transaction.hash)) // REMOVE
    }

    const embed = new EmbedBuilder()
        .setAuthor({name: `@${interaction.user.username} burned ${amount} ${artifact.name} 💀`, iconURL: config.token_icons[artifact.name]})

    await interaction.editReply({embeds: [embed]})
}