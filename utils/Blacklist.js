const DB     = require('./DB')
const Config = require('./Config')
const {Op}   = require('sequelize')
const moment = require('moment')

/**
 * Adds user to blacklist
 */
exports.add = async function (user, forever, duration = 0) {
    const timestamp = moment().unix() + duration

    await DB.rainBlacklist.create({
        user     : user.id,
        forever  : forever,
        timestamp: forever ? null : timestamp,
    })
}

/**
 * Removes user from blacklist
 */
exports.remove = async function (user) {
    await DB.rainBlacklist.destroy({where: {user: user.id}})
}


/**
 * Returns whether a user is blacklisted
 */
exports.listed = async function (user) {
    const blacklistEntry = await DB.rainBlacklist.findOne({
        where: {
            user   : user.id,
            [Op.or]: [
                {forever: true},
                {timestamp: {[Op.gt]: moment().unix()}}
            ]
        }
    })

    if (blacklistEntry) {
        return true
    }

    await DB.rainBlacklist.destroy({where: {user: user.id}})

    return false
}