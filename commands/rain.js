const {SlashCommandBuilder}                    = require('@discordjs/builders')
const {Wallet, React, Config, DB, Transaction} = require("../utils")
const {MessageEmbed}                           = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`rain`)
        .setDescription(`Rains your JEWEL`)
        .addNumberOption(option => option.setRequired(true).setName('amount').setDescription(`Enter the amount to tip`))
        .addStringOption(option => option.setRequired(true).setName('type').setDescription(`Select the rain type`).addChoices([
            ["Active - Split your tip amongst the last active 10 messages", "active"],
            ["Random - Split your tip amongst 10 random wallet owner in this channel", "random"],
            // ["Storm - Split your tip amongst all wallet holders", "storm"]
        ]))
        .addStringOption(option => option.setRequired(false).setName('token').setDescription(`Change the token`).addChoices([
            ["COINKx", "coinkx"]
        ])),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const amount = interaction.options.getNumber('amount')
        const type   = interaction.options.getString('type')
        const token  = interaction.options.getString('token') ?? Config.get('token.default')

        // Checks
        if (!await Wallet.check(interaction)) {
            return await React.error(interaction, 18, `No wallet`, `You have to tipping wallet yet. Please use the \`/deposit\` to create a new wallet`, true)
        }

        const processing = await DB.transactions.count({where: {author: interaction.user.id, processing: true}}) > 0
        if (processing) {
            return await React.error(interaction, 19, `Transactions in progress`, `Please wait for your current queue to be processed`, true)
        }

        if (amount === 0) {
            return await React.error(interaction, 20, `Incorrect amount`, `The tip amount should be larger than 0`, true)
        }

        if (amount < 0.01) {
            return await React.error(interaction, 21, `Incorrect amount`, `The tip amount is too low`, true)
        }

        const wallet  = await Wallet.get(interaction, interaction.user.id)
        const balance = await Wallet.balance(wallet, token)
        const from    = wallet.address

        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            return await React.error(interaction, 22, `Insufficient funds`, `The amount exceeds your balance + safety margin (0.001 ${Config.get(`tokens.${token}.symbol`)}). Use the \`/deposit\` command to get your wallet address to send some more ${Config.get(`tokens.${token}.symbol`)}. Or try again with a lower amount`, true)
        }

        // Get all wallet owners
        let wallets = await DB.wallets.findAll({
            attributes: ['user']
        })
        wallets     = wallets.filter(wallet => wallet.user !== process.env.BOT_WALLET_ADDRESS).map(wallet => wallet.user)

        let members = []

        // Tip last 10 active members
        let coveredMembers = []
        if (type === 'active') {
            const messages = await interaction.channel.messages.fetch()

            await Promise.all(messages.map(async message => {
                await message.reactions.resolve('☂️')?.users.fetch().then(async userList => {
                    // No covered members
                    if (userList.filter(user => user.id === interaction.user.id).size) {
                        coveredMembers.push(message.author.id)
                    }

                    // No command interactions
                    if (message.type === 'APPLICATION_COMMAND') {
                        return false
                    }

                    // No duplicates
                    if (members.includes(message.author.id)) {
                        return false
                    }

                    // No bots
                    if (message.author.bot) {
                        return false
                    }

                    // Definitely not yourself
                    if (message.author.id === interaction.user.id) {
                        return false
                    }

                    // Wallet owners only
                    if (!wallets.includes(message.author.id)) {
                        const embed = new MessageEmbed()
                            .setColor(Config.get('colors.primary'))
                            .setThumbnail(Config.get('token.thumbnail'))
                            .setTitle(`You've missed the rain ☂️`)
                            .setDescription(`@${interaction.user.username} rained in <#${interaction.channel.id}>. Unfortunately you missed the rain because you have not set up your tipping wallet yet. If you want to catch the next rain, please use the \`/deposit\` to create a new wallet`)
                        await message.author.send({embeds: [embed]})

                        return false
                    }

                    // Push if the message survived
                    members.push(message.author.id)
                })
            }))

            // We only need max 10
            members = members.slice(0, 10)
        }

        // Tip 10 random wallet owners in this channel
        if (type === 'random') {
            members = await interaction.channel.members
            members = members.filter(member => {
                return wallets.includes(member.user.id.toString()) && member.user.id !== interaction.user.id
            }).map(member => member.user.id)

            // We only need max 10
            members = members.slice(0, 10)
        }

        // Tip all wallet owners
        if (type === 'storm') {
            members = wallets.filter(wallet => wallet !== interaction.user.id)
        }

        if (members.length === 0) {
            await React.error(interaction, null, `Sorry`, `I couldn't find any users to rain on. Please try again when the chat is a bit more active`, true)
            await interaction.channel.send(`Wake up people! @${interaction.user.username} is trying to rain, but nobody is here!`)

            return
        }

        // Make transaction
        const splitAmount = (amount / members.length)

        for (let i = 0; i < members.length; i++) {
            const to = await Wallet.recipientAddress(interaction, members[i])

            await Transaction.addToQueue(interaction, from, to, splitAmount, token, members[i], amount, members.length)
        }

        await Transaction.runQueue(interaction, interaction.user.id, {transactionType: 'rain'}, {reply: true, react: true, ephemeral: false})

        await React.message(interaction, 'tip', amount)
    },
}