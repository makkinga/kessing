const {SlashCommandBuilder}                = require('discord.js')
const {Account, React, Token, Transaction} = require('../utils')


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
        const amount   = interaction.options.getNumber('amount')
        const token    = interaction.options.getString('token') ?? 'CRYSTAL'
        const artifact = await Token.artifact(token)
        const from     = await Account.address(interaction.user.id)

        // Checks
        if (!await Account.canTip(from)) {
            if (!await Account.active(from)) {
                return await React.error(interaction, null, `No account`, `You have not yet registered your account, please visit...`, true)
            }

            if (!await Account.verified(from)) {
                return await React.error(interaction, null, `Account not verified`, `You have not yet verified your account, please visit...`, true)
            }

            if (await Account.banned(from)) {
                return await React.error(interaction, null, `Banned`, `Your account has been banned from tipping. Visit .... to withdraw your tokens`, true)
            }
        }

        if (!await Account.hasBalance(from, amount, artifact.address)) {
            return await React.error(interaction, null, `Insufficient funds`, `Your current balance doesn't allow you to make this transaction.`, true)
        }

        // Make transaction
        await Transaction.burn(interaction, from, token, amount)
    },
}