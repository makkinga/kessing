const {SlashCommandBuilder}                = require('discord.js')
const {Account, React, Token, Transaction} = require('../utils')
const {ray}                                = require('node-ray')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip any member')
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription('Enter the amount to tip'))
        .addUserOption(option => option.setRequired(true).setName('member').setDescription('Select the lucky recipient'))
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
        const member   = interaction.options.getUser('member')
        const token    = interaction.options.getString('token') ?? 'CRYSTAL'
        const artifact = await Token.artifact(token)
        const from     = await Account.address(interaction.user.id)
        const to       = await Account.address(member.id)

        ray(member)

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

        if (!await Account.canBeTipped(to)) {
            if (!await Account.active(to)) {
                return await React.error(interaction, null, `Unable to send tip`, `${member.username} has not yet registered an account`, true)
            }

            if (!await Account.verified(to)) {
                return await React.error(interaction, null, `Unable to send tip`, `${member.username} has not yet verified his/her account`, true)
            }

            if (await Account.banned(to)) {
                return await React.error(interaction, null, `Unable to send tip`, `${member.username} has been banned from tipping`, true)
            }
        }

        if (!await Account.hasBalance(from, amount, artifact.address)) {
            return await React.error(interaction, null, `Insufficient funds`, `Your current balance doesn't allow you to make this transaction.`, true)
        }

        // Make transaction
        await Transaction.make(interaction, member, from, to, token, amount)
    },
}