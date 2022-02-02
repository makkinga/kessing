const {SlashCommandBuilder}   = require('@discordjs/builders')
const {Config, React, Wallet} = require('../utils')
const table                   = require('text-table')
const {MessageEmbed}          = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('private-key')
        .setDescription(`Reveals your private key`),

    async execute(interaction)
    {
        const wallet = await Wallet.get(interaction, interaction.user.id)

        let addresses = []
        for (const key in Config.get('tokens')) {
            addresses.push([
                Config.get(`tokens.${key}.symbol`),
                Config.get(`tokens.${key}.contract_address`),
            ])
        }

        const embed = new MessageEmbed()
            .setColor(Config.get('colors.error'))
            .setThumbnail(Config.get('token.thumbnail'))
            .setTitle(`Please store this private key in a safe place. This message will be removed in 30 seconds.`)
            .setDescription(`Note: You can import this private key into MetaMask or another wallet. However, never share your private key with anyone else.`)
            .addField(`Your address`, '```' + wallet.address + '```')
            .addField(`Your private key`, '```' + Wallet.privateKey(wallet) + '```')
            .addField(`Contract addresses to import`, '```' + table(addresses) + '```')
        await interaction.reply({embeds: [embed], ephemeral: true})
    },
}