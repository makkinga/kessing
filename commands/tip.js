const {SlashCommandBuilder}                          = require('@discordjs/builders')
const {Config, React, Wallet, Transaction, DB, Lang} = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription(`Send a tip another user`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to tip`))
        .addMentionableOption(option => option.setRequired(true).setName('recipient').setDescription(`Select the recipient`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount    = interaction.options.getNumber('amount')
        const recipient = interaction.options.getMentionable('recipient')
        const token     = Config.get('token.default')

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 29, Lang.trans(interaction, 'error.title.no_wallet'), Lang.trans(interaction, 'error.description.create_new_wallet'), true)
        }

        const processing = await DB.transactions.count({where: {author: interaction.user.id, processing: true}}) > 0
        if (processing) {
            return await React.error(interaction, 30, Lang.trans(interaction, 'error.title.transaction_in_progress'), Lang.trans(interaction, 'error.description.wait_for_queue'), true)
        }

        if (amount === 0) {
            return await React.error(interaction, 31, Lang.trans(interaction, 'error.title.amount_incorrect'), Lang.trans(interaction, 'error.description.amount_incorrect'), true)
        }

        if (amount < 0.01) {
            return await React.error(interaction, 32, Lang.trans(interaction, 'error.title.amount_incorrect'), Lang.trans(interaction, 'error.description.amount_low'), true)
        }

        if (recipient.user.id === process.env.BOT_ID) {
            return await React.error(interaction, 33, Lang.trans(interaction, 'error.title.invalid_user'), Lang.trans(interaction, 'tip.tip_me'), true)
        }

        if (recipient.user.bot) {
            return await React.error(interaction, 34, Lang.trans(interaction, 'error.title.invalid_user'), Lang.trans(interaction, 'tip.tip_bot'), true)
        }

        if (recipient.user.id === interaction.user.id) {
            return await React.error(interaction, 35, Lang.trans(interaction, 'error.title.invalid_user'), Lang.trans(interaction, 'tip.tip_self'), true)
        }

        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.balance(wallet, token)

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, 36, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.amount_exceeds_balance', {symbol: Config.get(`token.symbol`)}), true)
        }

        const from = wallet.address
        const to   = await Wallet.recipientAddress(interaction, recipient.user.id, recipient)

        Transaction.addToQueue(interaction, from, to, amount, token, recipient.user.id).then(() => {
            Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'tip'}, {reply: true, react: true, ephemeral: false})
        })

        await React.message(interaction, 'tip', amount)
    },
}