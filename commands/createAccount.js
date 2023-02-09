const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder} = require('discord.js')
const CryptoJS                                                             = require('crypto-js')

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
            .setTitle(`Create your tipping account`)
            .setDescription(`Please create your account using MetaMask by clicking the link below.`)

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Create my account')
                    .setURL(`https://kessing.dfk.gyd0x.nl?id=${id.replaceAll('+', ':p:').replaceAll('/', ':s:')}`)
                    .setStyle('Link')
            )

        await interaction.editReply({embeds: [embed], components: [button]})
    },
}