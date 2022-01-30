const {Command}     = require('discord-akairo')
const {React, Mods} = require('../utils')

class ModAddCommand extends Command
{
    constructor()
    {
        super('mod-add', {
            aliases: ['mod-add'],
            args   : [
                {
                    id       : 'member',
                    type     : 'member',
                    unordered: true
                }
            ]
        })
    }

    async exec(message, args)
    {
        await React.processing(message)

        if (!await Mods.isMod(message.author)) {
            await React.error(this, message, `Forbidden`, `You have no permission to edit the mod list`)

            return
        }

        if (!await Mods.isMod(args.member)) {
            await Mods.add(args.member)
        }

        await React.success(this, message)
    }
}

module.exports = ModAddCommand