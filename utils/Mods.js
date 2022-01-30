const DB = require('./DB')

/**
 * Adds user to mods list
 */
exports.add = async function (user) {
    await DB.mods.create({
        user: user.id,
    })
}

/**
 * Removes user from mods list
 */
exports.remove = async function (user) {
    await DB.mods.destroy({where: {user: user.id}})
}


/**
 * Returns whether a user is a mod
 */
exports.isMod = async function (user) {
    return await DB.mods.findOne({where: {user: user.id}})
}


/**
 * Returns all mods
 */
exports.all = async function () {
    return await DB.mods.findAll()
}