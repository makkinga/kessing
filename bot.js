require('dotenv').config()
const {AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler} = require('discord-akairo')
const {Config, DB, Token}                                               = require('./utils')

class BotClient extends AkairoClient
{
    constructor()
    {
        super({
            ownerID: Config.get('owner_ids')
        })

        /* Command handler */
        this.commandHandler = new CommandHandler(this, {
            directory      : './commands/',
            prefix         : Config.get('prefix'),
            defaultCooldown: Config.get('cooldown'),
        })

        /* Inhibitor handler */
        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './inhibitors/'
        })
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler)

        /* Listener handler */
        this.listenerHandler = new ListenerHandler(this, {
            directory: './listeners/'
        })
        this.listenerHandler.setEmitters({
            commandHandler  : this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler : this.listenerHandler,
        })
        this.commandHandler.useListenerHandler(this.listenerHandler)

        /* Load handlers */
        this.inhibitorHandler.loadAll()
        this.listenerHandler.loadAll()
        this.commandHandler.loadAll()
    }
}

const client = new BotClient()
client.login(process.env.TOKEN)

client.on('ready', () => {
    DB.syncDatabase()

    setPresence()
    setInterval(setPresence, 60000)
})

async function setPresence()
{
    const price = parseFloat(await Token.mochiPrice()).toFixed(3)

    await client.user.setPresence({activity: {name: `${Config.get('token.symbol')} at $${price}`, type: 3}})
}