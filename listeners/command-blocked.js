const { Listener } = require('discord-akairo')
const { React } = require('../utils') 

class CommandBlockedListener extends Listener {
    constructor() {
        super('commandBlocked', {
            emitter: 'commandHandler',
            event: 'commandBlocked'
        });
    }

    exec(message, command, reason) {
        switch (reason) {
            case 'guild' :
                React.error(this, message, `Not allowed`, `This command is only allowed in a public channel`)
                break
            case 'dm' :
                React.error(this, message, `Not allowed`, `This command is only allowed in this DM`)
                break
        }
    }
}

module.exports = CommandBlockedListener;