const {Harmony}                         = require('@harmony-js/core')
const {ChainType, ChainID, hexToNumber} = require('@harmony-js/utils')
const {BN, toBech32}                    = require('@harmony-js/crypto')
const {BigNumber}                       = require('bignumber.js')
const artifact                          = require('../artifact.json')
const Config                            = require('./Config')
const DB                                = require('./DB')
const React                             = require('./React')
const Wallet                            = require('./Wallet')
const TipStatistics                     = require('./TipStatistics')
const BurnStatistics                    = require('./BurnStatistics')
const Log                               = require('./Log')

/**
 * Add to Queue
 *
 * @param command
 * @param message
 * @param from
 * @param to
 * @param amount
 * @param token
 * @param recipient
 * @return {Promise<void>}
 */
exports.addToQueue = async function (command, message, from, to, amount, token, recipient = null) {
    await DB.transactions.create({
        message  : message.id,
        author   : message.author.id,
        recipient: recipient,
        from     : from,
        to       : to,
        amount   : amount,
        token    : token,
    }).catch(async error => {
        Log.error(error, message)
        await React.error(command, message, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`)
    })
}

/**
 * Run transaction queue
 *
 * @return {Promise<void>}
 * @param command
 * @param message
 * @param author
 * @param notifyAuthor
 * @param notifyRecipient
 * @param send
 * @param burn
 */
exports.runQueue = async function (command, message, author, notifyAuthor = false, notifyRecipient = false, send = false, burn = false, win = false) {
    const processing = await DB.transactions.count({where: {author: author, processing: true}}) > 0
    const hasQueue   = await DB.transactions.count({where: {author: author}}) > 0
    if (processing || !hasQueue) {
        return
    }

    const hmy = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )

    const wallet     = await Wallet.get(command, message, author)
    const privateKey = await Wallet.privateKey(wallet)
    const queue      = await DB.transactions.findAll({where: {message: message.id}})
    const lastNonce  = await hmy.blockchain.getTransactionCount({address: wallet.address}, 'pending')
    let nonce        = null

    for (let i = 0; i < queue.length; i++) {
        nonce = '0x' + (parseInt(hexToNumber(lastNonce.result)) + i).toString(16)

        await this.make(queue[i].from, queue[i].to, queue[i].amount, queue[i].token, privateKey, nonce)
            .then(async response => {
                if (response.success) {
                    DB.transactions.destroy({
                        where: {
                            id: queue[i].id
                        }
                    }).catch(async error => {
                        Log.error(error, message)
                        await React.error(command, message, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`)
                    })

                    if (notifyAuthor) {
                        await React.success(command, message, response.message)
                    } else {
                        await React.success(command, message)
                    }

                    if (notifyRecipient) {
                        const recipient = await command.client.users.cache.get(queue[i].recipient)

                        const embed = command.client.util.embed()
                            .setColor(Config.get('colors.primary'))
                        if (!win) {
                            embed
                                .setTitle(`You got tipped!`)
                                .setDescription(`@${message.author.username} tipped you ${queue[i].amount} ${Config.get('token.symbol')} in <#${message.channel.id}>`)
                        } else {
                            const titleArray   = await Config.get(`response.trivia_win_titles`)
                            const randomTitle  = titleArray[Math.floor(Math.random() * titleArray.length)]

                            embed
                                .setTitle(randomTitle)
                                .setDescription(`You received your prize of ${queue[i].amount} ${Config.get('token.symbol')}`)
                        }
                        await recipient.send(embed)
                    }

                    if (!send && !burn) {
                        await TipStatistics.addAmountToRanking(message.author.username, queue[i].amount)
                    }

                    if (burn) {
                        await BurnStatistics.addAmountToRanking(message.author.username, queue[i].amount)
                        await React.burn(message)
                    }

                    if (!send) {
                        await React.seaCreature(message, queue[i].amount)
                    }
                } else {
                    await DB.transactions.destroy({
                        where: {
                            from: queue[i].from
                        }
                    })

                    Log.debug(response.message, message)
                    await React.error(command, message, `An error has occurred`, `Error: ${response.message}\n\nPlease contact ${Config.get('error_reporting_users')}`)
                }
            })
            .catch(async error => {
                await DB.transactions.destroy({
                    where: {
                        author: queue[i].author
                    }
                })

                Log.error(error, message)
                await React.error(command, message, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`)
            })
    }

    await this.runQueue(command, message, author, notifyAuthor, notifyRecipient, send, burn)
}

/**
 * Make transaction
 *
 * @param from
 * @param to
 * @param amount
 * @param token
 * @param privateKey
 * @param nonce
 * @return {Promise<{success: boolean, message: string}>}
 */
exports.make = async function (from, to, amount, token, privateKey, nonce = null) {
    let txHash, receipt, error
    let confirmation      = null
    const hmy             = new Harmony(
        Config.get('token.rpc_url'),
        {
            chainType: ChainType.Harmony,
            chainId  : Config.get('chain_id'),
        },
    )
    const contract        = hmy.contracts.createContract(artifact.abi, Config.get(`tokens.${token}.contract_address`))
    const oneToHexAddress = (address) => hmy.crypto.getAddress(address).basicHex
    const weiAmount       = new BN(
        new BigNumber(parseFloat(amount)).multipliedBy(Math.pow(10, Config.get(`tokens.${token}.decimals`))).toFixed(),
        10
    )

    let sendOptions = {
        from    : from,
        gasLimit: '250000',
        gasPrice: new hmy.utils.Unit(30).asGwei().toWei(),
    }

    if (nonce !== null) {
        sendOptions.nonce = nonce
    }

    hmy.wallet.addByPrivateKey(privateKey)
    try {
        await contract.methods.transfer(to, weiAmount)
            .send(sendOptions)
            .on('transactionHash', (_hash) => {
                txHash = _hash
            })
            .on('receipt', (_receipt) => {
                receipt = _receipt
            })
            .on('confirmation', (_confirmation) => {
                confirmation = _confirmation
            })
            .on('error', (_error) => {
                error = _error
            })
    } catch (error) {
        return {
            success: false,
            message: `Transfer error: ${error}`,
        }
    }

    if (confirmation !== 'CONFIRMED') {
        return {
            success: false,
            message: `The transaction was rejected: ${txHash}`,
        }
    }
    if (error) {
        return {
            success: false,
            message: `Failed to send transaction`,
        }
    }

    return {
        success: true,
        message: `${Config.get('token.network_explorer')}/tx/${txHash}`,
    }
}

/**
 * Make gas transaction
 *
 * @param command
 * @param message
 * @param from
 * @param to
 * @param amount
 * @param privateKey
 * @return {Promise<{result: boolean, message: string}>}
 */
exports.sendGas = async function (command, message, from, to, amount, privateKey = null) {
    const fromShard = 0
    const toShard   = 0
    const gasLimit  = '25000'
    const gasPrice  = 30
    const recipient = await toBech32(to)
    const wallet    = await Wallet.get(command, message, from)
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