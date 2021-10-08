const {Command}       = require('discord-akairo')
const {Config, React} = require('../utils')

class PingCommand extends Command
{
    constructor()
    {
        super('ping', {
            aliases  : ['ping', 'marco', 'marko', 'tick', 'yin', 'yang', 'ding'],
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        switch (message.content.replace(Config.get('prefix'), '')) {
            case 'marco' :
            case 'marko' :
                await message.reply(`Polo!`)
                break
            case 'tick' :
                await message.reply(`Tock!`)
                break
            case 'yin' :
            case 'yang' :
                await message.reply(`Yang!`)
                break
            case 'ding' :
                await message.reply(`Dong!`)
                break
            case 'ping' :
            default:
                await message.reply(`Pong!`)
                break
        }
    }
}

module.exports = PingCommand