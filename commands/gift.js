const {SlashCommandBuilder, time}                     = require('@discordjs/builders')
const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js')
const {Config, Transaction, Wallet, React, DB, Lang}  = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`gift`)
        .setDescription(`Place a gift that can be claimed by any member`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to gift`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount = interaction.options.getNumber('amount')

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.no_wallet'), Lang.trans(interaction, 'error.description.create_new_wallet'), true)
        }

        const processing = await DB.transactions.count({where: {author: interaction.user.id, processing: true}}) > 0
        if (processing) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.transaction_in_progress'), Lang.trans(interaction, 'error.description.wait_for_queue'), true)
        }

        if (amount === 0) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.amount_incorrect'), Lang.trans(interaction, 'error.description.amount_incorrect'), true)
        }

        if (amount < 0.01) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.amount_incorrect'), Lang.trans(interaction, 'error.description.amount_low'), true)
        }

        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.balance(wallet, Config.get(`token.default`))
        const from    = wallet.address

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.amount_exceeds_balance', {symbol: Config.get(`token.symbol`)}), true)
        }

        // Send embed and button
        const timestamp = Date.now()
        const embed     = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setTitle(Lang.trans(interaction, 'gift.title', {user: interaction.user.username, amount: amount, symbol: Config.get('token.symbol')}))
            .setDescription(Lang.trans(interaction, 'gift.description'))

        const button = new MessageActionRow()
            .addComponents(new MessageButton()
                .setCustomId(`claim_${timestamp}`)
                .setLabel(Lang.trans(interaction, 'gift.button'))
                .setStyle('SUCCESS')
                .setEmoji('🎁'),
            )

        await interaction.editReply({embeds: [embed], components: [button], ephemeral: false})

        const collector = interaction.channel.createMessageComponentCollector()

        collector.on('collect', async i => {
            if (i.customId === `claim_${timestamp}`) {
                const claimedEmbed = new MessageEmbed()
                    .setTitle(Lang.trans(interaction, 'gift.title', {user: interaction.user.username, amount: amount, symbol: Config.get('token.symbol')}))
                    .setDescription(Lang.trans(interaction, 'gift.description'))

                const claimedButton = new MessageActionRow()
                    .addComponents(new MessageButton()
                        .setCustomId(`claimed_${timestamp}`)
                        .setLabel(Lang.trans(interaction, 'gift.button_claimed', {user: i.user.username}))
                        .setStyle('SECONDARY')
                        .setEmoji('🎁')
                        .setDisabled(true)
                    )
                await i.update({embeds: [claimedEmbed], components: [claimedButton]})

                const to = await Wallet.recipientAddress(i, i.member.user.id, i.member)

                Transaction.addToQueue(interaction, from, to, amount, Config.get('token.default')).then(() => {
                    Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'gift'}, {reply: false, react: false, ephemeral: false})
                })
            }
        })
    },
}