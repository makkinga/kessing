const {Sequelize} = require('sequelize')

/* Database */
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host   : process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
})

/**
 * Sync database
 */
exports.syncDatabase = async function () {
    await this.pendingGifts.truncate()
    await this.pendingGifts.sync()
    await this.giftCooldown.sync()
    await this.messageCount.sync()
}

/* Pending gifts */
exports.pendingGifts = sequelize.define('pending_gifts', {
    author: {
        type     : Sequelize.STRING,
        allowNull: false,
    }
})

/* Gift cooldown */
exports.giftCooldown = sequelize.define('gift_cooldown', {
    user     : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    command  : {
        type   : Sequelize.BOOLEAN,
        default: false
    },
    claim    : {
        type   : Sequelize.BOOLEAN,
        default: false
    },
    timestamp: {
        type     : Sequelize.INTEGER,
        allowNull: false,
    },
})

/* Message count */
exports.messageCount = sequelize.define('message_count', {
    user : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    guild: {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    count: {
        type     : Sequelize.INTEGER,
        allowNull: false,
    },
})