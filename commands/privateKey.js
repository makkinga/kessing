const {SlashCommandBuilder}         = require('@discordjs/builders')
const {Config, React, Wallet, Lang} = require('../utils')
const table                         = require('text-table')
const {MessageEmbed}                = require('discord.js')

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
                Config.get(`tokens.${key}.address`),
            ])
        }

        const embed = new MessageEmbed()
            .setColor(Config.get('colors.error'))
            .setThumbnail(Config.get('token.thumbnail'))
            .setTitle(Lang.trans(interaction, 'private_key.title'))
            .setDescription(Lang.trans(interaction, 'private_key.description'))
            .addField(Lang.trans(interaction, 'private_key.address'), '```' + wallet.address + '```')
            .addField(Lang.trans(interaction, 'private_key.key'), '```' + Wallet.privateKey(wallet) + '```')
            .addField(Lang.trans(interaction, 'private_key.contracts'), '```' + table(addresses) + '```')
        await interaction.reply({embeds: [embed], ephemeral: true})
    },
}