const {SlashCommandBuilder}                               = require('@discordjs/builders')
const {Wallet, React, Config, Transaction, DB, Log, Lang} = require('../utils')
const moment                                              = require('moment')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`get-gas`)
        .setDescription(`We will send you some gas. This only works if your balance is below 0.1 ONE`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 8, Lang.trans(interaction, 'error.title.no_wallet'), Lang.trans(interaction, 'error.description.create_new_wallet'), true)
        }

        // Gather data
        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.gasBalance(wallet)

        // Check for time out
        const timeout = await DB.gas.findOne({where: {user: interaction.user.id}})
        if (timeout && timeout.timestamp + Config.get('gas.time_out') > moment().unix()) {
            return await React.error(interaction, 9, Lang.trans(interaction, 'gas.time-out_title'), Lang.trans(interaction, 'gas.time-out_description', {end: moment.unix(timeout.timestamp + Config.get('gas.time_out')).fromNow()}), true)
        }

        // Destroy any left over time-outs
        await DB.gas.destroy({where: {user: interaction.user.id}})

        // Check for exploits
        if (parseFloat(balance) >= Config.get('gas.max_balance')) {
            return await React.error(interaction, 10, Lang.trans(interaction, 'gas.max_balance_title'), Lang.trans(interaction, 'gas.max_balance_title', {balance: balance}), true)
        }

        // Send gas
        await Transaction.sendGas(interaction, process.env.BOT_WALLET_ADDRESS, wallet.address, Config.get('gas.amount'), process.env.BOT_WALLET_PRIVATE_KEY)

        // Insert into database
        await DB.gas.create({
            user     : interaction.user.id,
            timestamp: moment().unix(),
        }).catch(async error => {
            await Log.error(interaction, 12, error)
            await React.error(interaction, 12, Lang.trans(interaction, 'error.title.error_occurred'), Lang.trans(interaction, 'error.description.contact_admin', {user: `<@490122972124938240>`}), true)
        })

        await React.success(interaction, Lang.trans(interaction, 'gas.success_title'), Lang.trans(interaction, 'gas.success_description'), true)
    },
}