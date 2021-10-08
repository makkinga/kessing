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
exports.syncDatabase = function () {
    this.wallets.sync()
    this.transactions.sync()
    this.tipRanks.sync()
    this.burnRanks.sync()
}

/* Wallets */
exports.wallets = sequelize.define('wallets', {
    user      : {
        type     : Sequelize.STRING,
        unique   : true,
        allowNull: false,
    },
    address   : {
        type     : Sequelize.STRING,
        unique   : true,
        allowNull: false,
    },
    privateKey: {
        type     : Sequelize.STRING,
        allowNull: false,
    },
})

/* Transactions */
exports.transactions = sequelize.define('transactions', {
    message   : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    author    : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    recipient : {
        type     : Sequelize.STRING,
        allowNull: true,
    },
    from      : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    to        : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    amount    : {
        type     : Sequelize.FLOAT,
        allowNull: false,
    },
    token    : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    processing: {
        type     : Sequelize.BOOLEAN,
        allowNull: true,
        default  : false,
    }
})

/* Tip ranking */
exports.tipRanks = sequelize.define('tip_ranks', {
    username: {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    amount  : {
        type     : Sequelize.FLOAT,
        allowNull: false,
    },
})

/* Burn ranking */
exports.burnRanks = sequelize.define('burn_ranks', {
    username: {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    amount  : {
        type     : Sequelize.FLOAT,
        allowNull: false,
    },
})