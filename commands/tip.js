const {SlashCommandBuilder}                      = require('discord.js')
const {Account, React, Token, Transaction, Lang} = require('../utils')
const {ray}                                      = require('node-ray')


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
        const tokenAddress = (token === 'JEWEL') ? artifact.bank_address : artifact.address
        const from     = await Account.address(interaction.user.id)
        const to       = await Account.address(member.id)

        // Checks
        if (!await Account.canTip(from)) {
            if (!await Account.active(from)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.no_account'), Lang.trans(interaction, 'error.description.no_account'), true)
            }

            if (!await Account.verified(from)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.unverified'), Lang.trans(interaction, 'error.description.unverified'), true)
            }

            if (await Account.banned(from)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.banned'), Lang.trans(interaction, 'error.description.banned'), true)
            }
        }

        if (!await Account.canBeTipped(to)) {
            if (!await Account.active(to)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.unable_to_tip'), Lang.trans(interaction, 'error.description.unable_to_tip.no_account', {username: member.username}), true)
            }

            if (!await Account.verified(to)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.unable_to_tip'), Lang.trans(interaction, 'error.description.unable_to_tip.unverified', {username: member.username}), true)
            }

            if (await Account.banned(to)) {
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.unable_to_tip'), Lang.trans(interaction, 'error.description.unable_to_tip.banned', {username: member.username}), true)
            }
        }

        if (!await Account.hasBalance(from, amount, tokenAddress)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.insufficient_funds'), true)
        }

        // Make transaction
        await Transaction.make(interaction, member, from, to, token, amount)
    },
}