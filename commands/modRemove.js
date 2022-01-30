const {Command}     = require('discord-akairo')
const {React, Mods} = require('../utils')

class ModRemoveCommand extends Command
{
    constructor()
    {
        super('mod-remove', {
            aliases: ['mod-remove'],
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

        if (args.member.id === '891355078416543774') {
            await React.error(this, message, `Forbidden`, `This mod can't be removed`)

            return
        }

        await Mods.remove(args.member)

        await React.success(this, message)
    }
}

module.exports = ModRemoveCommand