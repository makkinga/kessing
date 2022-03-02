const {Sequelize} = require('sequelize')
const DB          = require('./DB')

/**
 * Add tipped amount to rankings
 *
 * @param username
 * @param amount
 * @return {Promise<void>}
 */
exports.addAmountToRanking = async function (username, amount) {
    const ranking = await DB.tipRanks.findOne({where: {username: username}})

    if (ranking) {
        await DB.tipRanks.update({amount: parseFloat(ranking.amount + amount)}, {
            where: {
                username: username
            }
        })
    } else {
        await DB.tipRanks.create({
            username: username,
            amount  : amount,
        })
    }
}

/**
 * Get tippers top ten
 *
 * @return {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
 */
exports.getTippersTopTen = async function () {
    return await DB.tipRanks.findAll({
        limit: 10,
        order: [[Sequelize.col('amount'), 'DESC']]
    })
}

/**
 * Get tip total
 *
 * @return {Promise<string>}
 */
exports.getTipTotal = async function () {
    const result = await DB.tipRanks.findAll({
        attributes: ['amount', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
        raw       : true,
    })

    return parseFloat(result[0].total).toFixed(2)
}

/**
 * Get user tip amount
 *
 * @return {Promise<string>}
 */
exports.getUserTipAmount = async function (username) {
    const result = await DB.tipRanks.findAll({
        where: {
            username: username
        },
        raw  : true,
        limit: 1,
    })

    return parseFloat(result[0].amount).toFixed(2)
}