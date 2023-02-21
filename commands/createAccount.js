const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js')
const CryptoJS                                                             = require('crypto-js')
const {Lang}                                                               = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-account')
        .setDescription('Create an account'),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Get data
        const id = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(interaction.user.id), process.env.CREATE_ACCOUNT_CYPHER_SECRET).toString()

        // Send embed
        const embed = new EmbedBuilder()
            .setTitle(Lang.trans(interaction, 'create.title'))
            .setDescription(Lang.trans(interaction, 'create.description'))

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(Lang.trans(interaction, 'create.button'))
                    .setURL(`${process.env.GITBOOK_URL}?id=${id.replaceAll('+', ':p:').replaceAll('/', ':s:')}`)
                    .setStyle('Link')
            )

        await interaction.editReply({embeds: [embed], components: [button]})
    },
}