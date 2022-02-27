const {Command}                        = require('discord-akairo')
const {React, Blacklist, Mods, Config} = require('../utils')
const DB                               = require("../utils/DB")
const table                            = require("text-table")

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
        } else {
            if (!await Mods.isMod(message.author)) {
                await React.error(this, message, `Forbidden`, `You have no permission to show the rain blacklist`)

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
                .addField(`Rain blacklist`, users.length ? '```' + table(rows) + '```' : 'Empty')
            await message.channel.send(embed)
        }

        await React.success(this, message)
    }
}

module.exports = RainBlacklistCommand