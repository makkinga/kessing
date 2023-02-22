const {SlashCommandBuilder}                      = require('discord.js')
const {Transaction, Account, React, Token, Lang} = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snow')
        .setDescription('Split your CRYSTAL between 10 active members in the last 100 messages')
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription('Enter the amount to tip'))
        .addRoleOption(option => option.setRequired(false).setName('role').setDescription('Select a role to snow on')),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount       = interaction.options.getNumber('amount')
        const token        = 'CRYSTAL'
        const role         = interaction.options.getRole('role') ?? null
        const artifact     = await Token.artifact(token)
        const tokenAddress = artifact.address
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
        let checked        = []
        let ids            = []
        let members        = []
        let to             = []
        const guildMembers = await interaction.guild.members.fetch()
        const messages     = await interaction.channel.messages.fetch({limit: 100})

        for (const [key, message] of messages.entries()) {
            // No duplicates
            if (checked.includes(message.author.id)) {
                continue
            }
            checked.push(message.author.id)

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

            const author = await guildMembers.find(m => m.id === message.author.id)

            // Only account role holders
            if (!!!author.roles.cache.find(r => r.id === process.env.ACCOUNT_ROLE)) {
                continue
            }

            // Only selected role holders
            if (role) {
                if (!!!author.roles.cache.find(r => r.id === role)) {
                    continue
                }
            }

            // Only those who are worthy
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