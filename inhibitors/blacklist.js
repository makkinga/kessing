const {Inhibitor}     = require('discord-akairo')
const {Config, React} = require('../utils')

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
            React.error(this, message, `You have been blacklisted!`, `Please contact an admin if you think this was unjustified.`)
        }

        return blacklisted
    }
}

module.exports = BlacklistInhibitor