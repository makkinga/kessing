require('dotenv').config()
const fs                                    = require('fs')
const {Client, Collection, Intents}         = require('discord.js')
const {Token, Config, DB, React, Log, Lang} = require('./utils')

// Create a new client instance
const client = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ],
    partials: ['GUILD_MESSAGES', 'GUILDS', 'GUILD_MESSAGE_REACTIONS', 'USER', 'GUILD_MEMBER', 'GUILD_MEMBERS', 'MESSAGE', 'CHANNEL', 'REACTION'],
})

client.commands    = new Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)

    client.commands.set(command.data.name, command)
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    const command = client.commands.get(interaction.commandName)

    if (!command) return

    try {
        await command.execute(interaction)
    } catch (error) {
        await Log.error(interaction, 1, error)
        return await React.error(interaction, 1, Lang.trans(interaction, 'error.title.error_occurred'), Lang.trans(interaction, 'error.description.contact_admin', {user: `<@490122972124938240>`}), true)
    }
})

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN).then(async () => {
    console.log('Connected as:')
    console.log(`${client.user.username} #${client.user.discriminator}`)
    console.log('Connected to:')
    client.guilds.cache.forEach(guild => {
        console.log(`${guild.name} | ${guild.id}`)
    })

    await setPermissions()
    await DB.syncDatabase()

    await getPrice()
    await setPresence()
    setInterval(getPrice, 30000)
    setInterval(setPresence, 5000)
})

// Set price presence
let priceUsd  = 0
let priceOne  = 0
let priceEuro = 0
let presence  = 'usd'

async function setPresence()
{
    if (presence === 'usd') {
        await client.user.setPresence({activities: [{name: `${Config.get('token.symbol')} at ${priceOne} ONE`, type: 3}]})

        presence = 'one'
    }
    else if (presence === 'one') {
        await client.user.setPresence({activities: [{name: `${Config.get('token.symbol')} at $${priceUsd}`, type: 3}]})

        presence = 'euro'
    }
    else if (presence === 'euro') {
        await client.user.setPresence({activities: [{name: `${Config.get('token.symbol')} at €${priceEuro}`, type: 3}]})

        presence = 'usd'
    }
}

async function getPrice()
{
    const tokenPrice  = await Token.tokenPrice()
    const onePrice    = await Token.onePrice()
    const priceInOne  = tokenPrice.usd / onePrice
    const priceInEuro = await Token.tokenPriceInEuro(tokenPrice.usd)

    priceUsd  = parseFloat(tokenPrice.usd).toFixed(2)
    priceOne  = parseFloat(priceInOne).toFixed(2)
    priceEuro = parseFloat(priceInEuro).toFixed(2)
}

async function setPermissions()
{
    for (const guild of Config.get('guilds')) {
        let fullPermissions = []

        for (const [role, permissions] of Object.entries(Config.get('permissions'))) {
            for (const permission of permissions) {
                fullPermissions.push({
                    id         : Config.get(`commands.${guild}.${permission}`),
                    permissions: [{
                        id        : Config.get(`roles.${guild}.${role}`),
                        type      : 'ROLE',
                        permission: true,
                    }],
                })
            }
        }

        await client.guilds.cache.get(guild)?.commands.permissions.set({fullPermissions})
    }

}