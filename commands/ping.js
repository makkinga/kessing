const {Command}    = require('discord-akairo')

class PingCommand extends Command
{
    constructor()
    {
        super('ping', {
            aliases  : ['ping'],
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        await message.reply(`Pong!`)
    }
}

module.exports = PingCommand