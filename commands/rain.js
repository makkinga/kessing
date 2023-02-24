const {SlashCommandBuilder, EmbedBuilder}            = require('discord.js')
const {Transaction, Account, React, Token, Lang, DB} = require('../utils')
const config                                         = require('../config.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rain')
        .setDescription('Split your JEWEL between 10 active members in the last 100 messages')
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription('Enter the amount to tip'))
        .addStringOption(option => option.setRequired(false).setName('role').setDescription('Select a role to rain on').addChoices(
            {name: '@Heroes', value: 'hero'},
            {name: '@Active Hero', value: 'active_hero'},
            {name: '@True Hero', value: 'true_hero'},
        )),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount       = interaction.options.getNumber('amount')
        const token        = 'JEWEL'
        const role         = config.rain_roles[interaction.options.getString('role')] ?? null
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
        let checked        = []
        let ids            = []
        let members        = []
        let to             = []
        const messages     = await interaction.channel.messages.fetch({limit: 100})
        let accountHolders = await DB.accountHolders.findAll({where: {role: true}, attributes: ['user']})
        accountHolders     = accountHolders.map(r => r.user)

        for (const [key, message] of messages.entries()) {
            // Stop when we reach 10
            if (ids.length === 10) {
                break
            }

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

            // Only account role holders
            if (!accountHolders.includes(message.author.id)) {
                continue
            }

            // Only selected role holders
            if (role) {
                const author = await interaction.guild.members.fetch(message.author.id)
                if (!author.roles.cache.find(r => r.id === role.id)) {
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

        for (const id of ids) {
            to.push(await Account.address(id))
        }

        if (to.length) {
            await Transaction.split(interaction, members, from, to, token, amount, role)
        } else {
            const noMembersEmbed = new EmbedBuilder().setDescription('No members found to rain upon')

            return await interaction.editReply({embeds: [noMembersEmbed]})
        }
    }
}