const {SlashCommandBuilder, EmbedBuilder, MessageActionRow, MessageButton, ButtonStyle, ActionRowBuilder, ButtonBuilder} = require('discord.js')
const {Transaction, React, Lang, Account, Token, DB}                                                                     = require('../utils')
const config                                                                                                             = require('../config.json')
const {Op}                                                                                                               = require('sequelize')
const moment                                                                                                             = require('moment')


module.exports = {
    data: new SlashCommandBuilder()
        .setName(`gift`)
        .setDescription(`Place a gift that can be claimed by any member`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to gift`))
        .addStringOption(option => option.setRequired(false).setName('token').setDescription('Change the token').addChoices(
            {name: 'CRYSTAL', value: 'CRYSTAL'},
            {name: 'JEWEL', value: 'JEWEL'},
        )),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        const cooldown = await DB.giftCooldown.findOne({
            where: {
                user     : interaction.user.id,
                command  : true,
                timestamp: {[Op.gt]: moment().unix()}
            }
        })

        if (cooldown) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.not_allowed'), `${Lang.trans(interaction, 'gift.on_cooldown')} ${moment.unix(cooldown.timestamp).fromNow(true)}`, true)
        } else {
            await DB.giftCooldown.destroy({
                where: {
                    user   : interaction.user.id,
                    command: true
                }
            })
        }

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

        const hasPendingGift = await DB.pendingGifts.count({where: {author: interaction.user.id}}) > 0
        if (hasPendingGift) {
            return await React.error(interaction, null, `Pending gift`, `You have a pending gift, please wait for it to be claimed before sending a new gift`, true)
        }

        // Send embed and button
        const timestamp = Date.now()
        const embed     = new EmbedBuilder()
            .setTitle(Lang.trans(interaction, 'gift.title', {user: interaction.user.username, amount: amount, symbol: artifact.name}))
            .setDescription(Lang.trans(interaction, 'gift.description'))

        const button = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
                .setCustomId(`claim_${timestamp}`)
                .setLabel(Lang.trans(interaction, 'gift.button'))
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎁'),
            )

        await interaction.editReply({embeds: [embed], components: [button], ephemeral: false})

        await DB.pendingGifts.create({
            author: interaction.user.id
        })

        await DB.giftCooldown.create({
            user     : interaction.user.id,
            command  : true,
            timestamp: moment().add(10, 'minutes').unix()
        })

        const collector = interaction.channel.createMessageComponentCollector()

        let claimed = false

        collector.on('collect', async i => {
            if (i.customId === `claim_${timestamp}` && claimed === false) {
                const cooldown = await DB.giftCooldown.findOne({
                    where: {
                        user     : i.user.id,
                        claim    : true,
                        timestamp: {[Op.gt]: moment().unix()}
                    }
                })

                if (cooldown) {
                    i.reply({content: `${Lang.trans(interaction, 'gift.on_cooldown')} ${moment.unix(cooldown.timestamp).fromNow(true)}`, ephemeral: true})
                    return
                } else {
                    await DB.giftCooldown.destroy({
                        where: {
                            user : i.user.id,
                            claim: true
                        }
                    })
                }

                const to = Account.address(i.user.id)

                if (interaction.user.id === i.user.id) {
                    i.reply({content: Lang.trans(interaction, 'gift.self'), ephemeral: true})
                    return
                }

                if (!await Account.canBeTipped(to)) {
                    if (!await Account.active(to)) {
                        i.reply({content: Lang.trans(interaction, 'error.description.inactive'), ephemeral: true})
                        return
                    }

                    if (!await Account.verified(to)) {
                        i.reply({content: Lang.trans(interaction, 'error.description.unverified'), ephemeral: true})
                        return
                    }

                    if (await Account.banned(to)) {
                        i.reply({content: Lang.trans(interaction, 'error.description.banned'), ephemeral: true})
                        return
                    }
                }

                claimed = true

                await DB.giftCooldown.create({
                    user     : i.user.id,
                    claim    : true,
                    timestamp: moment().add(10, 'minutes').unix()
                })

                const claimedEmbed = new EmbedBuilder()
                    .setTitle(Lang.trans(interaction, 'gift.title', {user: interaction.user.username, amount: amount, symbol: artifact.name}))
                    .setDescription(Lang.trans(interaction, 'gift.description'))

                const claimedButton = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder()
                        .setCustomId(`claimed_${timestamp}`)
                        .setLabel(Lang.trans(interaction, 'gift.button_claimed', {user: i.user.username}))
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎁')
                        .setDisabled(true)
                    )
                await i.update({embeds: [claimedEmbed], components: [claimedButton]})
                // Make transaction
                await Transaction.make(interaction, i.user, from, to, token, amount)
            }
        })
    },
}