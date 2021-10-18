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

    exec(message, command, remaining)
    {
        React.error(command, message, `Chill out`, `${moment.duration(remaining).seconds()}s must elapse before you can poke me again`)
    }
}

module.exports = CooldownListener