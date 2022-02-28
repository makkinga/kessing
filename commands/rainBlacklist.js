const {Command}                              = require('discord-akairo')
const {React, Blacklist, Mods, Config, Lang} = require('../utils')
const DB                                     = require("../utils/DB")
const table                                  = require("text-table")

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
                    nullable : true,
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

        if (args.member) {
            if (!await Mods.isMod(message.author)) {
                await React.error(this, message, Lang.trans(message, 'error.title.forbidden'), Lang.trans(message, 'error.description.rain_blacklist_edit_permission'))

                return
            }

            if (args.member.id === '891355078416543774') {
                await React.error(this, message, Lang.trans(message, 'error.title.forbidden'), Lang.trans(message, 'error.description.user_cant_be_blacklisted'))

                return
            }

            if (!await Blacklist.listed(args.member)) {
                await Blacklist.add(args.member, !!args.forever)
            }
        } else {
            if (!await Mods.isMod(message.author)) {
                await React.error(this, message, Lang.trans(message, 'error.title.forbidden'), Lang.trans(message, 'error.description.rain_blacklist_show_permission'))

                return
            }

            const users = await DB.rainBlacklist.findAll()
            let rows    = []
            if (users.length) {
                for (let i = 0; i < users.length; i++) {
                    let user = await this.client.users.fetch(users[i].user)

                    rows.push([i, user.username])
                }
            }

            const embed = this.client.util.embed()
                .setColor(Config.get('colors.primary'))
                .addField(Lang.trans(message, 'embed.description.rain_blacklist'), users.length ? '```' + table(rows) + '```' : Lang.trans(message, 'empty'))
            await message.channel.send(embed)
        }

        await React.success(this, message)
    }
}

module.exports = RainBlacklistCommand