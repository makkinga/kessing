const {SlashCommandBuilder} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong'),

    async execute(interaction)
    {
        await interaction.reply({content: `<:jewel:937734755418517525>`, ephemeral: true})
    },
}