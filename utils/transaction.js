const tipperArtifact                                  = require('../artifacts/tipper.json')
const dotenv                                          = require('dotenv')
const {ethers}                                        = require('ethers')
const getRevertReason                                 = require('eth-revert-reason')
const {EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js')
const Token                                           = require('./token')
const config                                          = require('../config.json')
const {IncomingWebhook}                               = require('@slack/webhook')
const webhook                                         = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
const React                                           = require('./react')
const Lang                                            = require('./lang')
const Log                                             = require('./log')
const DB                                              = require('./db')
dotenv.config()

/**
 * Get nonce
 *
 * @param provider
 * @param signer
 * @returns {Promise<void>}
 */
async function getNonce(provider, signer)
{
    let nonce
    nonce = await DB.nonceCount.findOne({where: {name: 'nonce'}})

    if (!nonce) {
        nonce = await provider.getTransactionCount(signer.address)

        await DB.nonceCount.create({
            name: 'nonce',
            nonce
        })

        return nonce.nonce
    }

    await DB.nonceCount.increment({nonce: 1}, {where: {name: 'nonce'}})

    return nonce.nonce + 1
}

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
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const signer   = new ethers.Wallet(process.env.BOT_PKEY, provider)
    const nonce    = await getNonce(provider, signer)
    console.log(`nonce: ${nonce}`)
    const options        = {gasPrice: await provider.getGasPrice(), gasLimit: 300000, nonce: nonce}
    const tipperContract = new ethers.Contract(tipperArtifact.address, tipperArtifact.abi, provider)
    const tipper         = tipperContract.connect(signer)
    const artifact       = await Token.artifact(token)

    await checkGas(provider, signer)

    try {
        const transaction = await tipper.tip(
            from,
            to,
            ethers.utils.parseEther(amount.toString()),
            (token === 'JEWEL') ? artifact.bank_address : artifact.address,
            options
        )

        await transaction.wait(1)
    } catch (error) {
        await Log.error(interaction, 2, error)
        await Log.error(interaction, 2, await getRevertReason(error.transaction.hash))

        return await React.error(interaction, 2, Lang.trans(interaction, 'error.title.error_occurred'), null, true)
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
 * @param role
 * @returns {Promise<void>}
 */
exports.split = async function (interaction, members, from, to, token, amount, role = null) {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const signer   = new ethers.Wallet(process.env.BOT_PKEY, provider)
    const nonce    = await getNonce(provider, signer)
    console.log(`nonce: ${nonce}`)
    const options        = {gasPrice: await provider.getGasPrice(), gasLimit: 300000, nonce: nonce}
    const tipperContract = new ethers.Contract(tipperArtifact.address, tipperArtifact.abi, provider)
    const tipper         = tipperContract.connect(signer)
    const artifact       = await Token.artifact(token)
    let transaction

    try {
        transaction = await tipper.tipSplit(
            from,
            to,
            ethers.utils.parseEther(amount.toString()),
            (token === 'JEWEL') ? artifact.bank_address : artifact.address,
            options
        )

        await transaction.wait(1)
    } catch (error) {
        await Log.error(interaction, 3, error)
        await Log.error(interaction, 3, await getRevertReason(error.transaction.hash))

        return await React.error(interaction, 3, Lang.trans(interaction, 'error.title.error_occurred'), null, true)
    }

    const rain   = artifact.name === 'CRYSTAL' ? 'Snow' : 'Rain'
    const rained = artifact.name === 'CRYSTAL' ? 'snowed' : 'rained'
    const embed  = new EmbedBuilder()
        .setAuthor({name: `@${interaction.user.username} ${rained} ${amount} ${artifact.name}` + (role ? ` on @${role.name}` : ''), iconURL: config.token_icons[artifact.name]})
        .setFields({name: Lang.trans(interaction, 'rain.users_tipped', {amount: `${parseFloat(amount / members.length).toFixed(4)} ${artifact.name}`}), value: members.map(m => `@${m.username}#${m.discriminator}`).join(', ')},)

    const fields = [
        {name: Lang.trans(interaction, 'rain.users_tipped', {amount: `${parseFloat(amount / members.length).toFixed(4)} ${artifact.name}`}), value: members.map(m => `@${m.username}#${m.discriminator}`).join('\n ')},
        {name: Lang.trans(interaction, 'rain.total_tipped'), value: `${amount} ${artifact.name}`, inline: true},
        {name: Lang.trans(interaction, 'rain.channel'), value: `#${interaction.channel.name}`, inline: true}
    ]
    if (role) {
        fields.push({name: Lang.trans(interaction, 'rain.role'), value: `@${role.name}`, inline: false})
    }

    const receiptEmbed = new EmbedBuilder()
        .setAuthor({name: Lang.trans(interaction, 'rain.receipt_title', {rain}), iconURL: config.token_icons[artifact.name]})
        .setFields(fields)
        .setTimestamp()

    const explorerLink = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel(Lang.trans(interaction, 'rain.explorer_button'))
                .setURL(`https://subnets.avax.network/defi-kingdoms/tx/${transaction.hash}`)
                .setStyle('Link')
        )

    await interaction.user.send({embeds: [receiptEmbed], components: [explorerLink]})
    await interaction.editReply({embeds: [embed]})
}

/**
 * Burn tokens
 *
 * @param interaction
 * @param from
 * @param token
 * @param amount
 * @returns {Promise<void>}
 */
exports.burn = async function (interaction, from, token, amount) {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const signer   = new ethers.Wallet(process.env.BOT_PKEY, provider)
    const nonce    = await getNonce(provider, signer)
    console.log(`nonce: ${nonce}`)
    const options        = {gasPrice: await provider.getGasPrice(), gasLimit: 300000, nonce: nonce}
    const tipperContract = new ethers.Contract(tipperArtifact.address, tipperArtifact.abi, provider)
    const tipper         = tipperContract.connect(signer)
    const artifact       = await Token.artifact(token)

    try {
        const transaction = await tipper.burn(
            from,
            ethers.utils.parseEther(amount.toString()),
            (token === 'JEWEL') ? artifact.bank_address : artifact.address,
            options
        )

        await transaction.wait(1)
    } catch (error) {
        await Log.error(interaction, 4, error)
        await Log.error(interaction, 4, await getRevertReason(error.transaction.hash))

        return await React.error(interaction, 4, Lang.trans(interaction, 'error.title.error_occurred'), null, true)
    }

    const embed = new EmbedBuilder()
        .setAuthor({name: `@${interaction.user.username} burned ${amount} ${artifact.name} 💀`, iconURL: config.token_icons[artifact.name]})

    await interaction.editReply({embeds: [embed]})
}