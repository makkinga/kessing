const {Listener} = require('discord-akairo')
const {React}    = require("../utils")
const moment     = require('moment')

class CooldownListener extends Listener
{
    constructor()
    {
        super('cooldown', {
            emitter: 'commandHandler',
            event  : 'cooldown'
        })
    }

    async exec(message, command, remaining)
    {
        await message.react('❌')
        await React.done(message)

        const embed = command.client.util.embed()
            .setColor(Config.get('colors.error'))
            .setTitle(`Chill out`)
            .setDescription(`${moment.duration(remaining).seconds()}s must elapse before you can poke me again`)

        const embedMessage = await message.author.send(embed)

        setTimeout(async () => {
            await embedMessage.delete()
        }, 2000)
    }
}

module.exports = CooldownListener