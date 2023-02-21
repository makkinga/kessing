const {SlashCommandBuilder}                      = require('discord.js')
const {Transaction, Account, React, Token, Lang} = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rain')
        .setDescription('Split your JEWEL between 10 active members in the last 100 messages')
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription('Enter the amount to tip')),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount       = interaction.options.getNumber('amount')
        const token        = 'JEWEL'
        const artifact     = await Token.artifact(token)
        const tokenAddress = artifact.bank_address
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
                return await React.error(interaction, null, Lang.trans(interaction, 'error.title.banned'), Lang.trans(interaction, 'error.description.banned'), {accountDashboard: process.env.DASHBOARD_URL}, true)
            }
        }

        if (!await Account.hasBalance(from, amount, tokenAddress)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.insufficient_funds'), true)
        }

        // Get last 10 active members
        let ids        = []
        let members    = []
        let to         = []
        const messages = await interaction.channel.messages.fetch({limit: 100})

        for (const [key, message] of messages.entries()) {
            // No duplicates
            if (ids.includes(message.author.id)) {
                continue
            }

            // No command interactions
            if (message.type === 'APPLICATION_COMMAND') {
                continue
            }

            // No bots
            if (message.author.bot) {
                continue
            }

            // Definitely not yourself
            if (message.author.id === interaction.user.id) {
                continue
            }

            // Wallet owners only
            const address = Account.address(message.author.id)
            if (!await Account.canBeTipped(address)) {
                continue
            }

            // Push if the message survived
            ids.push(message.author.id)
            members.push(message.author)
        }

        // We only need max 10
        ids     = ids.slice(0, 10)
        members = members.slice(0, 10)

        for (const id of ids) {
            to.push(await Account.address(id))
        }

        await Transaction.split(interaction, members, from, to, token, amount)
    }
}