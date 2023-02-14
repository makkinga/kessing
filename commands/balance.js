const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js')
const table                                                                = require('text-table')
const config                                                               = require('../config.json')
const dotenv                                                               = require('dotenv')
const {Token, Account, Lang}                                               = require('../utils')
dotenv.config()

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('See your current balance'),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        const balanceRows  = []
        const tippedRows   = []
        const receivedRows = []
        const burnedRows   = []

        for (const token of config.tokens) {
            const artifact        = await Token.artifact(token)
            const contractAddress = (token === 'JEWEL') ? artifact.bank_address : artifact.address
            const userAddress     = await Account.address(interaction.user.id)

            let balance  = await Account.balance(userAddress, contractAddress)
            let tipped   = await Account.tipped(userAddress, contractAddress)
            let received = await Account.received(userAddress, contractAddress)
            let burned   = await Account.burned(userAddress, contractAddress)
            balanceRows.push([balance, token])
            tippedRows.push([tipped, token])
            receivedRows.push([received, token])
            burnedRows.push([burned, token])
        }

        const toNotification = new EmbedBuilder()
            .setTitle(Lang.trans(interaction, 'balance.title'))
            .setDescription('```' + table(balanceRows) + '```')
            .addFields(
                {name: `Tipped`, value: '```' + table(tippedRows) + '```'},
                {name: `Received`, value: '```' + table(receivedRows) + '```'},
                {name: `Burned`, value: '```' + table(burnedRows) + '```'},
            )
            .setTimestamp()

        const accountButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Show account')
                    .setURL('https://kessing.dfk.gyd0x.nl/')
                    .setStyle('Link')
            )

        const depositButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Deposit')
                    .setURL('https://kessing.dfk.gyd0x.nl/')
                    .setStyle('Link')
            )

        const withdrawButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Withdraw')
                    .setURL('https://kessing.dfk.gyd0x.nl/')
                    .setStyle('Link')
            )

        await interaction.editReply({embeds: [toNotification], components: [accountButton, depositButton, withdrawButton]})
    },
}