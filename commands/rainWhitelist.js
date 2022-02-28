const {Command}                      = require('discord-akairo')
const {React, Blacklist, Mods, Lang} = require('../utils')

class RainWhitelistCommand extends Command
{
    constructor()
    {
        super('rain-whitelist', {
            aliases: ['rain-whitelist'],
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
            await React.error(this, message, Lang.trans(message, 'error.title.forbidden'), Lang.trans(message, 'error.description.rain_blacklist_edit_permission'))

            return
        }

        if (await Blacklist.listed(args.member)) {
            await Blacklist.remove(args.member)
        }

        await React.success(this, message)
    }
}

module.exports = RainWhitelistCommand