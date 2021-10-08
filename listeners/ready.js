const {Listener} = require('discord-akairo')

class ReadyListener extends Listener
{
    constructor()
    {
        super('ready', {
            emitter  : 'client',
            eventName: 'ready'
        });
    }

    async exec()
    {
        console.log('foo'); // REMOVE
        console.log(this.client.commandHandler.constructor.name);
    }
} 