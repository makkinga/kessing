const {SlashCommandBuilder}  = require('discord.js')
const {Transaction, Account} = require('../utils')

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
        const amount = interaction.options.getNumber('amount')
        const token  = 'JEWEL'
        const from   = await Account.address(interaction.user.id)

        // Get last 10 active members
        let members    = []
        let to         = []
        const messages = await interaction.channel.messages.fetch({limit: 100})

        for (const [key, message] of messages.entries()) {
            // No duplicates
            if (members.includes(message.author.id)) {
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
            members.push(message.author.id)
        }

        // We only need max 10
        members = members.slice(0, 10)

        for (const id of members) {
            to.push(await Account.address(id))
        }

        await Transaction.split(interaction, members, from, to, token, amount)
    }
}