const {Command}       = require('discord-akairo')
const {Config, React} = require('../utils')

class OptInCommand extends Command
{
    constructor()
    {
        super('optout', {
            aliases  : ['optout', 'opt-out', 'imout'],
            ratelimit: 1,
            channel  : 'guild',
            args     : [
                {
                    id       : 'role',
                    type     : ['degen', 'trivia'],
                    unordered: true
                },
            ]
        })
    }

    async exec(message, args)
    {
        const roles = {
            'degen' : 'Degen',
            'trivia': 'Trivia',
        }

        const role   = message.guild.roles.cache.find(role => role.name === roles[args.role])
        const member = message.guild.members.cache.get(message.author.id)
        await member.roles.remove(role)

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Sorry to see you go`)
            .setDescription(`You are no longer a member of ${roles[args.role]}`)

        await message.channel.send(embed)
    }
}

module.exports = OptInCommand