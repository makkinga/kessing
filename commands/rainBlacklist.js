const {Command}                = require('discord-akairo')
const {React, Blacklist, Mods} = require('../utils')

class RainBlacklistCommand extends Command
{
    constructor()
    {
        super('rain-blacklist', {
            aliases: ['rain-blacklist'],
            args   : [
                {
                    id       : 'member',
                    type     : 'member',
                    unordered: true
                },
                {
                    id       : 'forever',
                    type     : 'text',
                    nullable : true,
                    unordered: true
                }
            ]
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        if (!await Mods.isMod(message.author)) {
            await React.error(this, message, `Forbidden`, `You have no permission to edit the rain blacklist`)

            return
        }

        if (args.member.id === '891355078416543774') {
            await React.error(this, message, `Forbidden`, `This user can't be blacklisted`)

            return
        }

        if (!await Blacklist.listed(args.member)) {
            await Blacklist.add(args.member, !!args.forever)
        }

        await React.success(this, message)
    }
}

module.exports = RainBlacklistCommand