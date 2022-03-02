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
    await this.wallets.sync()
    await this.transactions.sync()
    await this.transactions.truncate()
    await this.tipRanks.sync()
    await this.burnRanks.sync()
    await this.reminders.sync()
    await this.gas.sync()
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
    message            : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    author             : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    recipient          : {
        type     : Sequelize.STRING,
        allowNull: true,
    },
    from               : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    to                 : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    amount             : {
        type     : Sequelize.FLOAT,
        allowNull: false,
    },
    rainTotalAmount    : {
        type     : Sequelize.FLOAT,
        allowNull: true,
    },
    rainTotalRecipients: {
        type     : Sequelize.INTEGER,
        allowNull: true,
    },
    token              : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    processing         : {
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

/* Reminders */
exports.reminders = sequelize.define('reminders', {
    user     : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    channel  : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    timestamp: {
        type     : Sequelize.INTEGER,
        allowNull: false,
    },
    message  : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
})

/* Gas transactions */
exports.gas = sequelize.define('gas', {
    user     : {
        type     : Sequelize.STRING,
        allowNull: false,
    },
    timestamp: {
        type     : Sequelize.INTEGER,
        allowNull: false,
    },
})