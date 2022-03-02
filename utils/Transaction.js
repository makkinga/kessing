const {ethers}       = require('ethers')
const {Harmony}      = require('@harmony-js/core')
const {ChainType}    = require('@harmony-js/utils')
const {toBech32}     = require('@harmony-js/crypto')
const Config         = require('./Config')
const DB             = require('./DB')
const React          = require('./React')
const Wallet         = require('./Wallet')
const TipStatistics  = require('./TipStatistics')
const BurnStatistics = require('./BurnStatistics')
const Log            = require('./Log')
const {MessageEmbed} = require('discord.js')

/**
 * Add to Queue
 *
 * @param interaction
 * @param from
 * @param to
 * @param amount
 * @param token
 * @param recipient
 * @param rainTotalAmount
 * @param rainTotalRecipients
 * @return {Promise<void>}
 */
exports.addToQueue = async function (interaction, from, to, amount, token, recipient = null, rainTotalAmount = null, rainTotalRecipients = null) {
    await DB.transactions.create({
        message            : interaction.id,
        author             : interaction.user.id,
        recipient          : recipient,
        from               : from,
        to                 : to,
        amount             : amount,
        rainTotalAmount    : rainTotalAmount,
        rainTotalRecipients: rainTotalRecipients,
        token              : token,
    }).catch(async error => {
        await Log.error(interaction, 37, error)
        await React.error(interaction, 37, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
    })
}

/**
 * Run transaction queue
 *
 * @return {Promise<void>}
 * @param interaction
 * @param author
 * @param options
 * @param notification
 */
exports.runQueue = async function (interaction, author, options, notification) {
    const processing = await DB.transactions.count({where: {author: author, processing: true}}) > 0
    const hasQueue   = await DB.transactions.count({where: {author: author}}) > 0
    if (processing || !hasQueue) {
        return
    }

    const wallet             = await Wallet.get(interaction, author)
    const privateKey         = await Wallet.privateKey(wallet)
    const queue              = await DB.transactions.findAll({where: {message: interaction.id}})
    const provider           = new ethers.providers.JsonRpcProvider(Config.get('rpc_url'))
    const transactionOptions = {gasPrice: await provider.getGasPrice(), gasLimit: 250000}
    const signer             = new ethers.Wallet(privateKey, provider)
    const lastNonce          = await signer.getTransactionCount()

    for (let i = 0; i < queue.length; i++) {
        const artifact           = require(`../artifacts/${process.env.ENVIRONMENT}/${queue[i].token}.json`)
        const contract           = new ethers.Contract(artifact.address, artifact.abi, provider).connect(signer)
        transactionOptions.nonce = '0x' + (parseInt(lastNonce) + i).toString(16)

        try {
            // Transaction
            const tx = await contract.transfer(queue[i].to, ethers.utils.parseEther(queue[i].amount.toString()), transactionOptions)

            await tx.wait(1)

            console.log(`Transaction #${i + 1}`)

            // Remove from transaction queue
            DB.transactions.destroy({
                where: {
                    id: queue[i].id
                }
            }).catch(async error => {
                await Log.error(interaction, 38, error)
                return await React.error(interaction, 38, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
            })

            // Update statistics
            switch (options.transactionType) {
                case 'tip' :
                case 'rain' :
                case 'gift' :
                    await TipStatistics.addAmountToRanking(interaction.user.username, queue[i].amount)
                    break
                case 'burn' :
                    await BurnStatistics.addAmountToRanking(interaction.user.username, queue[i].amount)
                    break
            }

            // Notifications
            if (notification.reply) {
                const recipient                = await interaction.client.users.cache.get(queue[i].recipient)
                let replyTitle                 = ``
                let replyDescription           = null
                let recipientNotificationTitle = ``

                switch (options.transactionType) {
                    case 'tip' :
                        replyDescription = `💵 Tipped <@${recipient.id}> ${queue[i].amount} ${Config.get(`tokens.${queue[i].token}.symbol`)}`
                        break
                    case 'rain' :
                        replyTitle       = `☂️ Raining ${queue[i].rainTotalAmount} ${Config.get(`tokens.${queue[i].token}.symbol`)}!`
                        replyDescription = `Rained ${queue[i].amount} ${Config.get(`tokens.${queue[i].token}.symbol`)} on ${i + 1}/${queue[i].rainTotalRecipients} members`
                        break
                    case 'burn' :
                        replyDescription = `🔥 Burned ${queue[i].amount} ${Config.get(`tokens.${queue[i].token}.symbol`)}`
                        break
                    case 'send' :
                        replyDescription = `💵 Sent ${queue[i].amount} ${Config.get(`tokens.${queue[i].token}.symbol`)} to ${queue[i].to}`
                        break
                }

                const embed = new MessageEmbed()
                    .setColor(Config.get('colors.primary'))
                if (replyTitle) {
                    embed.setTitle(replyTitle)
                }
                if (replyDescription) {
                    embed.setDescription(replyDescription)
                }

                const reply = await interaction.editReply({embeds: [embed], ephemeral: notification.ephemeral})

                if (options.transactionType === 'tip' || options.transactionType === 'rain') {
                    if (typeof recipient !== 'undefined') {
                        const embed = new MessageEmbed()
                            .setColor(Config.get('colors.primary'))
                            .setTitle(recipientNotificationTitle)
                            .setDescription(`@${interaction.user.username} tipped you ${queue[i].amount} ${Config.get(`tokens.${queue[i].token}.symbol`)} in <#${interaction.channel.id}>`)
                        await recipient.send(embed).catch(async error => {
                            if (error.code === 50007) {
                                console.warn(`Cannot send DM to ${recipient.username}`)
                            }
                        })
                    }
                }

                // Reactions
                if (notification.react) {
                    switch (options.transactionType) {
                        case 'tip' :
                        case 'rain' :
                            await React.seaCreature(reply, queue[i].amount)
                            break
                        case 'burn' :
                            await React.seaCreature(reply, queue[i].amount)
                            await React.burn(reply)
                            break
                    }
                }
            }
        } catch (error) {
            await Log.error(interaction, 39, error)
            return await React.error(interaction, 39, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
        }
    }

    await this.runQueue(interaction, author, options, notification)
}

/**
 * Make gas transaction
 *
 * @param interaction
 * @param from
 * @param to
 * @param amount
 * @param privateKey
 * @return {Promise<{result: boolean, message: string}>}
 */
exports.sendGas = async function (interaction, from, to, amount, privateKey = null) {
    const fromShard = 0
    const toShard   = 0
    const gasLimit  = '25000'
    const gasPrice  = 30
    const recipient = await toBech32(to)
    const wallet    = await Wallet.get(interaction, from)
    if (privateKey === null) {
        privateKey = await Wallet.privateKey(wallet)
    }
    const hmy = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )

    const tx = hmy.transactions.newTx({
        to       : recipient,
        value    : new hmy.utils.Unit(amount).asEther().toWei().toString(),
        gasLimit : gasLimit,
        shardID  : typeof fromShard === 'string' ? Number.parseInt(fromShard, 10) : fromShard,
        toShardID: typeof toShard === 'string' ? Number.parseInt(toShard, 10) : toShard,
        gasPrice : new hmy.utils.Unit(gasPrice).asGwei().toWei().toString(),
    })

    hmy.utils.address

    await this.getShardInfo(hmy)

    const account  = hmy.wallet.addByPrivateKey(privateKey)
    const signedTx = await account.signTransaction(tx)

    signedTx
        .observed()
        .on('transactionHash', (txHash) => {
            // console.log('--- hash ---');
            // console.log(txHash);
        })
        .on('error', (error) => {
            return {
                result : false,
                message: 'Failed to sign transaction',
            }
        })

    const [sentTxn, txHash] = await signedTx.sendTransaction()
    const confirmedTx       = await sentTxn.confirm(txHash)

    let explorerLink
    if (confirmedTx.isConfirmed()) {
        explorerLink = `${Config.get('token.network_explorer')}/tx/${txHash}`
    } else {
        return {
            result : false,
            message: `Can not confirm transaction ${txHash}`,
        }
    }

    return {
        result : true,
        message: explorerLink,
    }
}

/**
 * Get shartd info
 * @return {Promise<*>}
 */
exports.getShardInfo = async function (harmony) {
    const response = await harmony.blockchain.getShardingStructure()
    harmony.shardingStructures(response.result)

    return response.result
}