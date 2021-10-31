const {Command}             = require('discord-akairo')
const axios                 = require("axios")
const table                 = require('text-table')
const {Config, React, Hero} = require("../utils")

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
            url   : 'https://graph.defikingdoms.com/subgraphs/name/defikingdoms/apiv5',
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
            .addField(`Name`, name)
            .addField(`Shiny`, hero.shiny ? 'Yes' : 'No')
            .addFields(
                {name: `Generation`, value: hero.generation, inline: true},
                {name: `Rarity`, value: Hero.getRarity(hero.rarity), inline: true},
                {name: `Level`, value: hero.level, inline: true},
            )
            .addFields(
                {name: `HP`, value: hero.hp, inline: true},
                {name: `MP`, value: hero.mp, inline: true},
                {name: `Stamina`, value: hero.stamina, inline: true},
            )

        let stats = [
            ['STR', hero.strength],
            ['AGI', hero.agility],
            ['END', hero.endurance],
            ['WIS', hero.wisdom],
            ['DEX', hero.dexterity],
            ['VIT', hero.vitality],
            ['INT', hero.intelligence],
            ['LCK', hero.luck],
        ]
        embed.addField(`Stats`, '```' + table(stats) + '```')

        let professions = [
            [`Fishing${hero.profession === 'fishing' ? '*' : ''}`, hero.fishing],
            [`Foraging${hero.profession === 'foraging' ? '*' : ''}`, hero.foraging],
            [`Gardening${hero.profession === 'gardening' ? '*' : ''}`, hero.gardening],
            [`Mining${hero.profession === 'mining' ? '*' : ''}`, hero.mining],
        ]
        embed.addField(`Professions`, '```' + table(professions) + '```')

        await message.channel.send(embed)
        await React.done(message)
    }
}

module.exports = HeroCommand