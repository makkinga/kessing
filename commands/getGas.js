const {SlashCommandBuilder}                             = require('@discordjs/builders')
const {Wallet, React, Config, Transaction, DB, Helpers} = require("../utils")
const Log                                               = require("../utils/Log")
const {Op}                                     = require("sequelize")
const moment                                   = require("moment")

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`get-gas`)
        .setDescription(`We will send you some gas. This only works if your balance is below 0.1 ONE`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true});

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 8, `No wallet`, `You have to tipping wallet yet. Please use the \`/deposit\` to create a new wallet`, true)
        }

        // Gather data
        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.gasBalance(wallet)

        // Check for time out
        const timeout = await DB.gas.findOne({where: {user: interaction.user.id}})
        if (timeout && timeout.timestamp + Config.get('gas.time_out') > moment().unix()) {
            return await React.error(interaction, 9, `Time-out`, `Please wait for your time-out to end ${moment.unix(timeout.timestamp + Config.get('gas.time_out')).fromNow()}`, true)
        }

        // Destroy any left over time-outs
        await DB.gas.destroy({where: {user: interaction.user.id}})

        // Check for exploits
        if (parseFloat(balance) >= Config.get('gas.max_balance')) {
            return await React.error(interaction, 10, `Are you trying to scam me?`, `You have ${balance} ONE!`, true)
        }

        // Send gas
        await Transaction.sendGas(interaction, 11, process.env.BOT_WALLET_ADDRESS, wallet.address, Config.get('gas.amount'), process.env.BOT_WALLET_PRIVATE_KEY)

        // Insert into database
        await DB.gas.create({
            user     : interaction.user.id,
            timestamp: moment().unix(),
        }).catch(async error => {
            Log.error(error)
            await React.error(interaction, 12, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
        })

        await React.success(interaction, `Success!`, 'Some gas was sent to your wallet', true)
    },
}