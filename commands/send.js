const {SlashCommandBuilder}                = require('@discordjs/builders')
const {Config, React, Wallet, Transaction} = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription(`Send your JEWEL to an external address`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to tip (will be ignored when max is set to true)`))
        .addStringOption(option => option.setRequired(true).setName('address').setDescription(`Enter the address`))
        .addBooleanOption(option => option.setRequired(false).setName('max').setDescription(`Send the max amount?`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Options
        let amount  = interaction.options.getNumber('amount')
        const address = interaction.options.getString('address')
        const token   = interaction.options.getString('token')
        const max     = interaction.options.getBoolean('max') ?? false
        
        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 25, `No wallet`, `You have to tipping wallet yet. Please use the \`/deposit\` to create a new wallet`, true)
        }

        if (amount === 0) {
            return await React.error(interaction, 26, `Incorrect amount`, `The amount should be larger than 0`, true)
        }

        if (amount < 0.01) {
            return await React.error(interaction, 27, `Incorrect amount`, `The amount is too low`, true)
        }

        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.balance(wallet, token)
        const from = wallet.address
        const to   = address

        if (max) {
            amount = balance - 0.001
        }

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, 28, `Insufficient funds`, `The amount exceeds your balance + safety margin (0.001 ${Config.get(`tokens.${token}.symbol`)}). Try again with an amount lowe than ${parseFloat(balance - 0.001).toFixed(4)} ${Config.get(`tokens.${token}.symbol`)}`, true)
        }

        Transaction.addToQueue(interaction, from, to, amount, token).then(() => {
            Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'send'}, {reply: true, react: false, ephemeral: true})
        })
    },
}