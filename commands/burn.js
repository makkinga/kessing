const {SlashCommandBuilder}                      = require('discord.js')
const {Account, React, Token, Transaction, Lang} = require('../utils')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('burn')
        .setDescription('Burn your tokens')
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to burn`))
        .addStringOption(option => option.setRequired(false).setName('token').setDescription('Change the token').addChoices(
            {name: 'CRYSTAL', value: 'CRYSTAL'},
            {name: 'JEWEL', value: 'JEWEL'},
        )),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount       = interaction.options.getNumber('amount')
        const token        = interaction.options.getString('token') ?? 'CRYSTAL'
        const artifact     = await Token.artifact(token)
        const tokenAddress = (token === 'JEWEL') ? artifact.bank_address : artifact.address
        const from         = await Account.address(interaction.user.id)

        // Checks
        if (!await Account.canTip(from)) {
            if (!await Account.active(from)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.no_account'), Lang.trans(interaction, 'error.description.no_account'), true)
            }

            if (!await Account.verified(from)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.unverified'), Lang.trans(interaction, 'error.description.unverified'), true)
            }

            if (await Account.banned(from)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.banned'), Lang.trans(interaction, 'error.description.banned', {accountDashboard: process.env.DASHBOARD_URL}), true)
            }
        }

        if (!await Account.hasBalance(from, amount, tokenAddress)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.insufficient_funds'), true)
        }

        // Make transaction
        await Transaction.burn(interaction, from, token, amount)
    },
}