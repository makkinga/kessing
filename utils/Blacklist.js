const {Op}   = require('sequelize')
const moment = require('moment')
const DB     = require('./DB')
const Config = require('./Config')

/**
 * Adds user to blacklist
 */
exports.add = async function (user, forever) {
    const timestamp = moment().unix() + Config.get('blacklist_time_out')

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