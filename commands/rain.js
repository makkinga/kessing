const {SlashCommandBuilder}                                     = require('@discordjs/builders')
const {Wallet, React, Config, DB, Transaction, Blacklist, Lang} = require('../utils')
const {MessageEmbed}                                            = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`rain`)
        .setDescription(`Rains your JEWEL`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to tip`))
        .addStringOption(option => option.setRequired(true).setName('type').setDescription(`Select the rain type`).addChoices([
            ['Active - Split your tip amongst max 10 last active members', 'active'],
            ['Random - Split your tip amongst 10 random wallet owners in this channel', 'random'],
        ]))
        .addStringOption(option => option.setRequired(false).setName('message').setDescription(`Attach a message`)),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount  = interaction.options.getNumber('amount')
        const type    = interaction.options.getString('type')
        const message = interaction.options.getString('message')
        const token   = Config.get('token.default')

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
        const balance = await Wallet.balance(wallet, token)
        const from    = wallet.address

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, null, Lang.trans(interaction, 'error.title.insufficient_funds'), Lang.trans(interaction, 'error.description.amount_exceeds_balance', {symbol: Config.get(`token.symbol`)}), true)
        }

        // Get all wallet owners
        let wallets = await DB.wallets.findAll({
            attributes: ['user']
        })
        wallets     = wallets.filter(wallet => wallet.user !== process.env.BOT_WALLET_ADDRESS).map(wallet => wallet.user)

        let members = []

        // Tip last 10 active members
        if (type === 'active') {
            const messages = await interaction.channel.messages.fetch()

            // return
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
                if (!wallets.includes(message.author.id)) {
                    const embed = new MessageEmbed()
                        .setColor(Config.get('colors.primary'))
                        .setThumbnail(Config.get('token.thumbnail'))
                        .setTitle(Lang.trans(interaction, 'rain.missed_title'))
                        .setDescription(Lang.trans(interaction, 'rain.missed_description', {user: interaction.user.username, channel: `<#${interaction.channel.id}>`}))
                    try {
                        await message.author.send({embeds: [embed]})
                    } catch (error) {
                        if (error.code === 50007) {
                            console.warn(`Cannot send DM to ${message.author.username}`)
                        }
                    }

                    continue
                }

                // No beggars
                if (await Blacklist.listed(message.author)) {
                    continue
                }

                // Push if the message survived
                members.push(message.author.id)
            }

            // We only need max 10
            members = members.slice(0, 10)
        }

        // Tip 10 random wallet owners in this channel
        if (type === 'random') {
            members = await interaction.channel.members
            members = members.filter(async member => {
                let valid = true

                // Wallet holders only
                if (!wallets.includes(member.user.id.toString())) {
                    valid = false
                }

                // // Definitely not yourself
                if (member.user.id === interaction.user.id) {
                    valid = false
                }

                // No beggars
                if (await Blacklist.listed(member.user)) {
                    valid = false
                }

                return valid
            }).map(member => member.user.id)

            // We only need max 10
            members = members.slice(0, 10)
        }

        // Tip all wallet owners
        if (type === 'storm') {
            members = wallets.filter(wallet => wallet !== interaction.user.id)
        }

        if (members.length === 0) {
            await React.error(interaction, null, Lang.trans(interaction, 'rain.no_users_title'), Lang.trans(interaction, 'rain.no_users_description'), true)
            await interaction.channel.send(Lang.trans(interaction, 'rain.wake_up'))

            return
        }

        // Make transaction
        const splitAmount = (amount / members.length)

        for (let i = 0; i < members.length; i++) {
            const to = await Wallet.recipientAddress(interaction, members[i])

            await Transaction.addToQueue(interaction, from, to, splitAmount, token, members[i], amount, members.length)
        }

        await Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'rain', message: message}, {reply: true, react: true, ephemeral: false})
    },
}