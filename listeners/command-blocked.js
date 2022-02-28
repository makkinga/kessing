const {Listener}    = require('discord-akairo')
const {React, Lang} = require('../utils')

class CommandBlockedListener extends Listener
{
    constructor()
    {
        super('commandBlocked', {
            emitter: 'commandHandler',
            event  : 'commandBlocked'
        })
    }

    exec(message, command, reason)
    {
        switch (reason) {
            case 'guild' :
                React.error(this, message, Lang.trans(message, 'error.error.not_allowed'), Lang.trans(message, 'error.description.guild_only'))
                break
            case 'dm' :
                React.error(this, message, Lang.trans(message, 'error.error.not_allowed'), Lang.trans(message, 'error.description.dm_only'))
                break
        }
    }
}

module.exports = CommandBlockedListener