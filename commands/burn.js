const {SlashCommandBuilder}                          = require('@discordjs/builders')
const {Config, React, Wallet, Transaction, DB, Lang} = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('burn')
        .setDescription(`Burn JEWEL`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to burn`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount = interaction.options.getNumber('amount')

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 2, Lang.trans(interaction, 'error.title.no_wallet'), Lang.trans(interaction, 'error.description.create_new_wallet'), true)
        }

        const processing = await DB.transactions.count({where: {author: interaction.user.id, processing: true}}) > 0
        if (processing) {
            return await React.error(interaction, 3, Lang.trans(interaction, 'error.title.transaction_in_progress'), Lang.trans(interaction, 'error.description.wait_for_queue'), true)
        }

        if (amount === 0) {
            return await React.error(interaction, 4, Lang.trans(interaction, 'error.title.amount_incorrect'), Lang.trans(interaction, 'error.description.amount_incorrect'), true)
        }

        if (amount < 0.01) {
            return await React.error(interaction, 5, Lang.trans(interaction, 'error.title.amount_incorrect'), Lang.trans(interaction, 'error.description.amount_low'), true)
        }

        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.balance(wallet, Config.get(`token.default`))
        const from    = wallet.address
        const to      = '0x000000000000000000000000000000000000dead'

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, 6, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.amount_exceeds_balance', {symbol: Config.get(`token.symbol`)}), true)
        }

        Transaction.addToQueue(interaction, from, to, amount, Config.get(`token.default`)).then(() => {
            Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'burn'}, {reply: true, react: true, ephemeral: false})
        })

        await React.message(interaction, 'burn')
    },
}