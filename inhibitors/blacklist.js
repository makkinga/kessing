const {Inhibitor}           = require('discord-akairo')
const {Config, React, Lang} = require('../utils')

class BlacklistInhibitor extends Inhibitor
{
    constructor()
    {
        super('blacklist', {
            reason: 'blacklist'
        })
    }

    exec(message)
    {
        const blacklist   = Config.get('blacklist')
        const blacklisted = blacklist.includes(message.author.id)

        if (blacklisted) {
            React.error(this, message, Lang.trans(message, 'error.title.blacklisted'), Lang.trans(message, 'error.description.contact_admin_if_unjustified'))
        }

        return blacklisted
    }
}

module.exports = BlacklistInhibitor