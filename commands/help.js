const {SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder} = require('discord.js')
const {ComponentType}                                                                               = require('discord-api-types/v8')
const axios                                                                                         = require('axios')
const table                                                                                         = require('text-table')
const config                                                                                        = require('../config.json')
const {Lang}                                                                                        = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help using the bot'),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        const content = await axios.get('https://api.gitbook.com/v1/spaces/SrNx1aAiTRCGjylKXiu1/content', {
            headers: {Authorization: `Bearer ${process.env.GITBOOK_TOKEN}`}
        })

        const pages = await content.data.pages.filter(page => page.slug === 'commands')[0].pages

        const options = []
        for (const page of pages) {
            options.push({
                label: page.title,
                value: page.id,
            })
        }

        const embed = new EmbedBuilder()
            .setAuthor({name: Lang.trans(interaction, 'help.title'), iconURL: config.bot.icon})
            .setDescription(Lang.trans(interaction, 'help.description'))
            .setFields(
                {name: Lang.trans(interaction, 'help.getting_started_title'), value: Lang.trans(interaction, 'help.getting_started_description', {bot: config.bot.name})},
                {name: Lang.trans(interaction, 'help.bug_report_title'), value: Lang.trans(interaction, 'help.bug_report_description')}
            )

        const buttonsRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(Lang.trans(interaction, 'help.getting_started'))
                    .setURL(`${process.env.GITBOOK_URL}getting-started`)
                    .setStyle('Link')
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel(Lang.trans(interaction, 'help.commands'))
                    .setURL(`${process.env.GITBOOK_URL}commands`)
                    .setStyle('Link')
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel(Lang.trans(interaction, 'help.faq'))
                    .setURL(`${process.env.GITBOOK_URL}faq`)
                    .setStyle('Link')
            )

        const selectRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('command')
                    .setPlaceholder(Lang.trans(interaction, 'help.select_command'))
                    .addOptions(options)
            )

        const select    = await interaction.editReply({embeds: [embed], components: [buttonsRow, selectRow]})
        const collector = select.createMessageComponentCollector({componentType: ComponentType.SelectMenu})

        collector.on('collect', async i => {
            const page = await axios.get(`https://api.gitbook.com/v1/spaces/SrNx1aAiTRCGjylKXiu1/content/page/${i.values[0]}`, {
                headers: {Authorization: `Bearer gb_api_F4cK4Ej28o26dDiUjEsMt7Z9h48KlAKIKt8PTGof`}
            })

            const embeds = []

            embeds.push(new EmbedBuilder()
                .setTitle(page.data.title)
                .setDescription(page.data.description))

            let nodeEmbed = null
            let fields    = []
            for (const node of page.data.document.nodes) {
                switch (node.type) {
                    case 'heading-2' :
                        if (nodeEmbed !== null) {
                            nodeEmbed.setFields(fields)
                            embeds.push(nodeEmbed)
                            nodeEmbed = null
                            fields    = []
                        }

                        nodeEmbed = new EmbedBuilder()
                            .setTitle(node.nodes[0].leaves[0].text)
                        break
                    case 'table' :
                        nodeEmbed = null
                        break
                    case 'paragraph' :
                        let text = ''
                        for (const subNode of node.nodes) {
                            if (subNode.leaves) {
                                for (const leaf of subNode.leaves) {
                                    if (Object.entries(leaf.marks).length && leaf.marks[0].type === 'code') {
                                        text += `\`${leaf.text}\``
                                    } else {
                                        text += leaf.text
                                    }
                                }
                            }
                            if (subNode.type === 'link') {
                                text += subNode.nodes[0].leaves[0].text
                            }
                        }

                        fields.push({
                            name : '\u200b',
                            value: text,
                        })
                        break
                    case 'hint' :
                        if (nodeEmbed !== null) {
                            nodeEmbed.setFields(fields)
                            embeds.push(nodeEmbed)
                            nodeEmbed = null
                        }

                        const colors = {
                            info   : {color: '#346DDB', icon: 'https://storage.gyd0x.nl/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/discord-hint/info.png'},
                            warning: {color: '#B95E03', icon: 'https://storage.gyd0x.nl/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/discord-hint/warning.png'},
                            danger : {color: '#D33E3D', icon: 'https://storage.gyd0x.nl/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/discord-hint/danger.png'},
                            success: {color: '#278847', icon: 'https://storage.gyd0x.nl/ed2319ff-1320-4572-a9c4-278c4d80b634-bucket/dfk/discord-hint/success.png'},
                        }

                        nodeEmbed = new EmbedBuilder()
                            .setAuthor({name: '\u200b', iconURL: colors[node.data.style].icon})
                            .setColor(colors[node.data.style].color)

                        const hintFields = []
                        for (const subNode of node.nodes) {
                            hintFields.push({
                                name : '\u200b',
                                value: subNode.nodes[0].leaves[0].text,
                            })
                        }

                        nodeEmbed.setFields(hintFields)
                        embeds.push(nodeEmbed)
                        nodeEmbed = null
                        break
                }
            }

            if (nodeEmbed !== null) {
                nodeEmbed.setFields(fields)
                embeds.push(nodeEmbed)
            }

            const link = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(Lang.trans(interaction, 'help.read_full_docs'))
                        .setURL(`https://docs.kessing.gyd0x.nl/commands/${page.data.slug}`)
                        .setStyle('Link')
                )

            await i.reply({embeds: embeds, components: [link], ephemeral: true})
        })

        collector.on('end', async collected => {
            //
        })
    },
}