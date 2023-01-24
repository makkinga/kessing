const {SlashCommandBuilder, EmbedBuilder} = require('discord.js')
const table                               = require('text-table')
const config                              = require('../config.json')
const dotenv                              = require('dotenv')
const {Account, Token}                    = require('../utils')
const {ray}                               = require('node-ray')
dotenv.config()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balances')
        .setDescription('See all balances'),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        const tableRows = []

        ray(await Account.address(interaction.user.id))

        for (const token of config.tokens) {
            const artifact = await Token.artifact(token)
            let balance    = await Account.balance(await Account.address(interaction.user.id), artifact.address)
            tableRows.push([balance, token])
        }

        const memberRows = []
        const members    = [
            {name: 'Gyd0xAlt', id: '1064536929426755634'},
            {name: 'Bolon Soron', id: '607946034546475042'},
            {name: 'sashei', id: '416316384650330115'},
        ]

        await Promise.all(members.map(async (member) => {
            for (const token of config.tokens) {
                const artifact = await Token.artifact(token)
                const balance  = await Account.balance(Account.address(member.id), artifact.address)
                memberRows.push([member.name, balance, token])
            }
        }))

        const toNotification = new EmbedBuilder()
            .setTitle(`Your balance`)
            .setDescription('```' + table(tableRows) + '```')
            .addFields(
                {name: `Member balances`, value: '```' + table(memberRows) + '```'}
            )
            .setTimestamp()

        await interaction.editReply({embeds: [toNotification]})
    },
}