const {Command} = require('discord-akairo')
const {React}   = require("../utils")

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
        await React.message(message, 'tip', 100)
    }
}

module.exports = PingCommand