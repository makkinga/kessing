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
    console.log('Ready!')
    
    DB.syncDatabase()

    getPrice()
    setPresence()
    setInterval(getPrice, 60000)
    setInterval(setPresence, 5000)
})


let priceUsd = 0
let priceOne = 0
let presence = 'usd'

async function setPresence()
{
    if (presence === 'usd') {
        await client.user.setPresence({activity: {name: `${Config.get('token.symbol')} at ${priceOne} ONE`, type: 3}})

        presence = 'one'
    } else {
        await client.user.setPresence({activity: {name: `${Config.get('token.symbol')} at $${priceUsd}`, type: 3}})

        presence = 'usd'
    }
}

async function getPrice()
{
    const tokenPrice = await Token.tokenPrice()
    const onePrice   = await Token.onePrice()
    const priceInOne = tokenPrice.usd / onePrice

    priceUsd = parseFloat(tokenPrice.usd).toFixed(3)
    priceOne = parseFloat(priceInOne).toFixed(3)
}