const {Command}       = require('discord-akairo')
const {Config, React} = require('../utils')

class OptInCommand extends Command
{
    constructor()
    {
        super('optin', {
            aliases  : ['optin', 'opt-in', 'countmein'],
            ratelimit: 1,
            channel  : 'guild',
            args     : [
                {
                    id       : 'role',
                    type     : ['trivia'],
                    unordered: true
                },
            ]
        })
    }

    async exec(message, args)
    {
        const roles = {
            'trivia': 'Trivia',
        }

        const role   = message.guild.roles.cache.find(role => role.name === roles[args.role])
        const member = message.guild.members.cache.get(message.author.id)
        await member.roles.add(role)

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Welcome to ${roles[args.role]}`)
            .setDescription(`You are now officially one of us!`)

        await message.channel.send(embed)
    }
}

module.exports = OptInCommand