const {SlashCommandBuilder}                    = require('@discordjs/builders')
const {Config, React, Wallet, Transaction, DB} = require('../utils')

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
            return await React.error(interaction, 2, `No wallet`, `You have to tipping wallet yet. Please use the \`/deposit\` to create a new wallet`, true)
        }

        const processing = await DB.transactions.count({where: {author: interaction.user.id, processing: true}}) > 0
        if (processing) {
            return await React.error(interaction, 3, `Transactions in progress`, `Please wait for your current queue to be processed`, true)
        }

        if (amount === 0) {
            return await React.error(interaction, 4, `Incorrect amount`, `The tip amount should be larger than 0`, true)
        }

        if (amount < 0.01) {
            return await React.error(interaction, 5, `Incorrect amount`, `The tip amount is too low`, true)
        }

        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.balance(wallet, Config.get(`token.default`))
        const from    = wallet.address
        const to      = '0x000000000000000000000000000000000000dead'

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, 6, `Insufficient funds`, `The amount exceeds your balance + safety margin (0.001 ${Config.get(`token.symbol`)}). Use the \`/deposit\` command to get your wallet address to send some more ${Config.get(`token.symbol`)}. Or try again with a lower amount`, true)
        }

        Transaction.addToQueue(interaction, from, to, amount, Config.get(`token.default`)).then(() => {
            Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'burn'}, {reply: true, react: true, ephemeral: false})
        })

        await React.message(interaction, 'burn')
    },
}