const fs                                                = require('fs')
const {Client, Collection, GatewayIntentBits, Partials} = require('discord.js')
const dotenv                                            = require('dotenv')
const {DB, React, Token, Lang, Log}                     = require('./utils')
const CryptoJS                                          = require('crypto-js')
dotenv.config()

// Create a new client instance
const client = new Client({intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel]})

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!')
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

        return await React.error(interaction, 1, Lang.trans(interaction, 'error.title.general'), Lang.trans(interaction, 'error.description.error_occurred'), true)
    }
})

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN).then(async function () {
    console.log('Connected as:')
    console.log(`${client.user.username} #${client.user.discriminator}`)

    await DB.syncDatabase()
    console.log('Database synced')

    await getTokenInfo()
    await setPresence()
    setInterval(getTokenInfo, 30000)
    setInterval(setPresence, 5000)
})

// Set price presence
let jewelPriceUsd,
    jewelPriceChange,
    crystalPriceUsd,
    crystalPriceChange,
    jadePriceUsd,
    jadePriceChange = 0
let presence        = 'jewel'

async function setPresence()
{
    if (presence === 'jewel') {
        await client.user.setPresence({activities: [{name: `1JE at $${jewelPriceUsd} (${jewelPriceChange}%)`, type: 3}]})

        presence = 'crystal'
    } else if (presence === 'crystal') {
        await client.user.setPresence({activities: [{name: `1CR at $${crystalPriceUsd} (${crystalPriceChange}%)`, type: 3}]})

        presence = 'jade'
    } else if (presence === 'jade') {
        await client.user.setPresence({activities: [{name: `1JA at $${jadePriceUsd} (${jadePriceChange}%)`, type: 3}]})

        presence = 'jewel'
    }
}

async function getTokenInfo()
{
    try {
        const jewelInfo   = await Token.jewelInfo()
        const crystalInfo = await Token.crystalInfo()
        const jadeInfo    = await Token.jadeInfo()

        jewelPriceUsd      = parseFloat(jewelInfo.priceUsd).toFixed(3)
        jewelPriceChange   = jewelInfo.priceChange.h24
        crystalPriceUsd    = parseFloat(crystalInfo.priceUsd).toFixed(3)
        crystalPriceChange = crystalInfo.priceChange.h24
        jadePriceUsd       = parseFloat(jadeInfo.priceUsd).toFixed(3)
        jadePriceChange    = jadeInfo.priceChange.h24
    } catch (error) {
        console.warn('Unable to get price')

        jewelPriceUsd, jewelPriceChange, crystalPriceUsd, crystalPriceChange, jadePriceUsd, jadePriceChange = 0
    }
}

// async function setPermissions()
// {
//     for (const guild of Config.get('guilds')) {
//         let fullPermissions = []
//
//         for (const [role, permissions] of Object.entries(Config.get('permissions'))) {
//             for (const permission of permissions) {
//
//                 const guildRoles = typeof Config.get(`roles.${guild}.${role}`) === 'object'
//                     ? Config.get(`roles.${guild}.${role}`)
//                     : [Config.get(`roles.${guild}.${role}`)]
//
//                 for (const guildRole of guildRoles) {
//                     fullPermissions.push({
//                         id         : Config.get(`commands.${guild}.${permission}`),
//                         permissions: [{
//                             id        : guildRole,
//                             type      : 'ROLE',
//                             permission: true,
//                         }],
//                     })
//                 }
//             }
//         }
//
//         try {
//             await client.guilds.cache.get(guild)?.commands.permissions.set({fullPermissions})
//         } catch (error) {
//             console.log(error)
//         }
//     }
// }