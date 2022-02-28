const {Command}           = require('discord-akairo')
const axios               = require("axios")
const table               = require('text-table')
const {React, Hero, Lang} = require("../utils")

class HeroCommand extends Command
{
    constructor()
    {
        super('hero', {
            aliases  : ['hero'],
            args     : [
                {
                    id     : 'id',
                    type   : 'number',
                    default: 1,
                },
            ],
            ratelimit: 1,
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        const response = await axios({
            url   : 'https://graph4.defikingdoms.com/subgraphs/name/defikingdoms/apiv5',
            method: 'post',
            data  : {
                query    : `
                    query hero($id: ID!) {
                      hero(id: $id) {
                      generation
                        firstName
                        lastName
                        rarity
                        visualGenes
                        strength
                        agility
                        endurance
                        wisdom
                        dexterity
                        vitality
                        stamina
                        intelligence
                        luck
                        hp
                        mp
                        xp
                        level
                        profession
                        gender
                        gardening
                        foraging
                        fishing
                        mining
                        shiny
                      }
                    }
                `,
                variables: {
                    "id": `${args.id}`
                }
            }
        })
        const hero     = response.data.data.hero
        const name     = Hero.getFullName(hero.gender, hero.firstName, hero.lastName)

        const embed = this.client.util.embed()
            .setColor(Hero.getColor(hero.rarity))
            .setTitle(`Hero #${args.id}`)
            .setThumbnail('https://cdn.discordapp.com/icons/861728723991527464/a_3480dd8a8f41d429341272626dfc61db.webp?size=160')
            .addField(Lang.trans(message, 'embed.hero.name'), name)
            .addField(Lang.trans(message, 'embed.hero.shiny'), hero.shiny ? 'Yes' : 'No')
            .addFields(
                {name: Lang.trans(message, 'embed.hero.generation'), value: hero.generation, inline: true},
                {name: Lang.trans(message, 'embed.hero.rarity'), value: Hero.getRarity(hero.rarity), inline: true},
                {name: Lang.trans(message, 'embed.hero.level'), value: hero.level, inline: true},
            )
            .addFields(
                {name: Lang.trans(message, 'embed.hero.hp'), value: hero.hp, inline: true},
                {name: Lang.trans(message, 'embed.hero.mp'), value: hero.mp, inline: true},
                {name: Lang.trans(message, 'embed.hero.stamina'), value: hero.stamina, inline: true},
            )

        let stats = [
            [Lang.trans(message, 'embed.hero.strength'), hero.strength],
            [Lang.trans(message, 'embed.hero.agility'), hero.agility],
            [Lang.trans(message, 'embed.hero.endurance'), hero.endurance],
            [Lang.trans(message, 'embed.hero.wisdom'), hero.wisdom],
            [Lang.trans(message, 'embed.hero.dexterity'), hero.dexterity],
            [Lang.trans(message, 'embed.hero.vitality'), hero.vitality],
            [Lang.trans(message, 'embed.hero.intelligence'), hero.intelligence],
            [Lang.trans(message, 'embed.hero.luck'), hero.luck],

        ]

        embed.addField(Lang.trans(message, 'embed.hero.stats'), '```' + table(stats) + '```')

        let professions = [
            [`${Lang.trans(message, 'embed.hero.fishing')}${hero.profession === 'fishing' ? '*' : ''}`, hero.fishing],
            [`${Lang.trans(message, 'embed.hero.foraging')}${hero.profession === 'foraging' ? '*' : ''}`, hero.foraging],
            [`${Lang.trans(message, 'embed.hero.gardening')}${hero.profession === 'gardening' ? '*' : ''}`, hero.gardening],
            [`${Lang.trans(message, 'embed.hero.mining')}${hero.profession === 'mining' ? '*' : ''}`, hero.mining],
        ]
        embed.addField(Lang.trans(message, 'embed.hero.professions'), '```' + table(professions) + '```')

        await message.channel.send(embed)
        await React.done(message)
    }
}

module.exports = HeroCommand