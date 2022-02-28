const {Command}                   = require('discord-akairo')
const {React, Mods, Config, Lang} = require('../utils')
const table                       = require("text-table")

class ModsCommand extends Command
{
    constructor()
    {
        super('mods', {
            aliases: ['mods'],
        })
    }

    async exec(message, args)
    {
        if (!await Mods.isMod(message.author)) {
            await React.error(this, message, Lang.trans(message, 'error.title.forbidden'), Lang.trans(message, 'error.description.show_list_permission'))

            return
        }

        const mods = await Mods.all()
        let rows   = []
        for (let i = 0; i < mods.length; i++) {
            let user = await this.client.users.fetch(mods[i].user)

            rows.push([i, user.username])
        }

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .addField(Lang.trans(message, 'embed.title.mods'), '```' + table(rows) + '```')
        await message.channel.send(embed)
    }
}

module.exports = ModsCommand