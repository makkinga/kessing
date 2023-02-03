const {SlashCommandBuilder, EmbedBuilder} = require('discord.js')
const axios                               = require('axios')
const {Hero, React, Lang}                 = require('../utils')
const table                               = require('text-table')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hero')
        .setDescription('Displays info about a Hero')
        .addNumberOption(option => option.setRequired(true).setName('id').setDescription('Enter the hero\'s ID')),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: false})

        // Options
        const id = interaction.options.getNumber('id')

        // https://defi-kingdoms-community-api-gateway-co06z8vi.uc.gateway.dev/graphql?query=query%20%7B%0A%20%20hero%20(id%3A%20%2230%22)%20%7B%0A%20%20%20%20generation%0A%20%20%20%20firstName%0A%20%20%20%20lastName%0A%20%20%20%20rarity%0A%20%20%20%20visualGenes%0A%20%20%20%20stamina%0A%20%20%20%20staminaFullAt%0A%20%20%20%20strength%0A%20%20%20%20strengthGrowthP%0A%20%20%20%20strengthGrowthS%0A%20%20%20%20agility%0A%20%20%20%20agilityGrowthP%0A%20%20%20%20agilityGrowthS%0A%20%20%20%20endurance%0A%20%20%20%20enduranceGrowthP%0A%20%20%20%20enduranceGrowthS%0A%20%20%20%20wisdom%0A%20%20%20%20wisdomGrowthP%0A%20%20%20%20wisdomGrowthS%0A%20%20%20%20dexterity%0A%20%20%20%20dexterityGrowthP%0A%20%20%20%20dexterityGrowthS%0A%20%20%20%20vitality%0A%20%20%20%20vitalityGrowthP%0A%20%20%20%20vitalityGrowthS%0A%20%20%20%20intelligence%0A%20%20%20%20intelligenceGrowthP%0A%20%20%20%20intelligenceGrowthS%0A%20%20%20%20luck%0A%20%20%20%20luckGrowthP%0A%20%20%20%20luckGrowthS%0A%20%20%20%20hp%0A%20%20%20%20mp%0A%20%20%20%20xp%0A%20%20%20%20level%0A%20%20%20%20profession%0A%20%20%20%20gender%0A%20%20%20%20gardening%0A%20%20%20%20foraging%0A%20%20%20%20fishing%0A%20%20%20%20mining%0A%20%20%20%20shiny%0A%20%20%7D%0A%7D%0A%23%20query%20hero(%24id%3A%20ID!)%20%7B%0A%23%20%20%20hero(id%3A%2030)%20%7B%0A%23%20%20%20%20%20generation%0A%23%20%20%20%20%20firstName%0A%23%20%20%20%20%20lastName%0A%23%20%20%20%20%20rarity%0A%23%20%20%20%20%20visualGenes%0A%23%20%20%20%20%20strength%0A%23%20%20%20%20%20agility%0A%23%20%20%20%20%20endurance%0A%23%20%20%20%20%20wisdom%0A%23%20%20%20%20%20dexterity%0A%23%20%20%20%20%20vitality%0A%23%20%20%20%20%20stamina%0A%23%20%20%20%20%20intelligence%0A%23%20%20%20%20%20luck%0A%23%20%20%20%20%20hp%0A%23%20%20%20%20%20mp%0A%23%20%20%20%20%20xp%0A%23%20%20%20%20%20level%0A%23%20%20%20%20%20profession%0A%23%20%20%20%20%20gender%0A%23%20%20%20%20%20gardening%0A%23%20%20%20%20%20foraging%0A%23%20%20%20%20%20fishing%0A%23%20%20%20%20%20mining%0A%23%20%20%20%20%20shiny%0A%23%20%20%20%7D%0A%23%20%7D%0A&operationName=hero
        const response = await axios({
            url   : 'https://defi-kingdoms-community-api-gateway-co06z8vi.uc.gateway.dev/graphql',
            method: 'post',
            data  : {
                query    : `
                    query hero($id: ID!) {
                        hero(id: $id) {
                            gender
                            firstName
                            lastName
                            owner {
                                name
                            }
                            mainClassStr
                            subClassStr
                            professionStr
                            generation
                            rarity
                            shiny
                            level
                            maxSummons
                            summonsRemaining
                            xp
                            hp
                            mp
                            stamina
                            staminaFullAt
                            summons
                            strength
                            strengthGrowthP
                            strengthGrowthS
                            agility
                            agilityGrowthP
                            agilityGrowthS
                            endurance
                            enduranceGrowthP
                            enduranceGrowthS
                            wisdom
                            wisdomGrowthP
                            wisdomGrowthS
                            dexterity
                            dexterityGrowthP
                            dexterityGrowthS
                            vitality
                            vitalityGrowthP
                            vitalityGrowthS
                            intelligence
                            intelligenceGrowthP
                            intelligenceGrowthS
                            luck
                            luckGrowthP
                            luckGrowthS
                            mining
                            fishing
                            gardening
                            foraging  
                            statBoost1
                            statBoost2
                        }
                    }
                `,
                variables: {
                    'id': `${id}`
                }
            }
        }).catch(async e => {
            await React.error(interaction, 5, 'Timeout', 'The hero API timed out. Please try again.', true)

            return
        })

        if (response.data == null) {
            await React.error(interaction, 5, 'Oops', 'No response from the API.', true)

            return
        }

        const hero = response.data.data.hero
        const name = Hero.getFullName(hero.gender, hero.firstName, hero.lastName)

        const embed = new EmbedBuilder()
            .setColor(Hero.getColor(hero.rarity))
            .setTitle(`Hero #${id}`)
            .setThumbnail(`https://heroes.defikingdoms.com/image/${id}`)
            .addFields(
                {name: `Name`, value: name},
                {name: `Owned by`, value: hero.owner.name},

                {name: `Main Class`, value: `${hero.mainClassStr}`, inline: true},
                {name: `Sub Class`, value: `${hero.subClassStr}`, inline: true},
                {name: `Profession`, value: `${hero.professionStr}`, inline: true},

                {name: `Generation`, value: `${hero.generation}`, inline: true},
                {name: `Rarity`, value: Hero.getRarity(hero.rarity), inline: true},
                {name: `Shiny`, value: hero.shiny ? 'Yes' : 'No', inline: true},

                {name: `Level`, value: `${hero.level}`, inline: true},
                {name: `Summons`, value: `${hero.summonsRemaining} / ${hero.maxSummons}`, inline: true},
                {name: `XP`, value: `${hero.xp} / ${Hero.calculateRequiredXp(hero.level)} (${parseFloat((100 / Hero.calculateRequiredXp(hero.level)) * hero.xp).toFixed(1)}%)`, inline: true},

                {name: `Health`, value: `${hero.hp}`, inline: true},
                {name: `Mana`, value: `${hero.mp}`, inline: true},
                {name: `Stamina`, value: `${Hero.calculateRemainingStamina(hero)} / ${hero.stamina}`, inline: true},

                {name: `Heroes Summoned`, value: `${hero.summons}`},
            )

        let stats = [
            ['STR', hero.strength, '|', 'DEX', hero.dexterity],
            ['AGI', hero.agility, '|', 'VIT', hero.vitality],
            ['END', hero.endurance, '|', 'INT', hero.intelligence],
            ['WIS', hero.wisdom, '|', 'LCK', hero.luck],
        ]

        embed.addFields({name: `Stats`, value: '```' + table(stats) + '```'})

        let statGrowth = [
            ['.', 'PRI', 'SEC', '.', '.', 'PRI', 'SEC'],
            ['STR', Hero.getStaminaPercentage(hero.strengthGrowthP), Hero.getStaminaPercentage(hero.strengthGrowthS), '|', 'DEX', Hero.getStaminaPercentage(hero.dexterityGrowthP), Hero.getStaminaPercentage(hero.dexterityGrowthS)],
            ['AGI', Hero.getStaminaPercentage(hero.agilityGrowthP), Hero.getStaminaPercentage(hero.agilityGrowthS), '|', 'VIT', Hero.getStaminaPercentage(hero.vitalityGrowthP), Hero.getStaminaPercentage(hero.vitalityGrowthS)],
            ['END', Hero.getStaminaPercentage(hero.enduranceGrowthP), Hero.getStaminaPercentage(hero.enduranceGrowthS), '|', 'INT', Hero.getStaminaPercentage(hero.intelligenceGrowthP), Hero.getStaminaPercentage(hero.intelligenceGrowthS)],
            ['WIS', Hero.getStaminaPercentage(hero.wisdomGrowthP), Hero.getStaminaPercentage(hero.wisdomGrowthS), '|', 'LCK', Hero.getStaminaPercentage(hero.luckGrowthP), Hero.getStaminaPercentage(hero.luckGrowthS)],
        ]

        embed.addFields({name: `Stat Growth`, value: '```' + table(statGrowth) + '```'})

        let professions = [
            [`Fishing${hero.professionStr === 'fishing' ? '*' : ''}`, parseFloat(hero.fishing / 10).toFixed(1)],
            [`Foraging${hero.professionStr === 'foraging' ? '*' : ''}`, parseFloat(hero.foraging / 10).toFixed(1)],
            [`Gardening${hero.professionStr === 'gardening' ? '*' : ''}`, parseFloat(hero.gardening / 10).toFixed(1)],
            [`Mining${hero.professionStr === 'mining' ? '*' : ''}`, parseFloat(hero.mining / 10).toFixed(1)],
        ]

        embed.addFields({name: `Professions`, value: '```' + table(professions) + '```'})

        // Reply
        await interaction.editReply({embeds: [embed]})
    },
}