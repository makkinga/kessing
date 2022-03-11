const fs       = require('fs')
const {REST}   = require('@discordjs/rest')
const {Routes} = require('discord-api-types/v9')
const dotenv   = require('dotenv')
dotenv.config()
const clientId = process.env.CLIENT_ID
const token    = process.env.DISCORD_TOKEN
const {Config} = require('./utils')

const commands     = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    commands.push(command.data.toJSON())
}

const rest = new REST({version: '9'}).setToken(token)

console.log(`commands:`)
for (const guild of Config.get('guilds')) {
    rest.put(Routes.applicationGuildCommands(clientId, guild), {body: commands})
        .then(allCommands => {
            console.log(`  "${guild}":`)
            const commands = allCommands.filter(c => [
                'blacklist', 'whitelist', 'rank'
            ].includes(c.name))

            for (const command of commands) {
                console.log(`    ${command.name}: '${command.id}'`)
            }
        })
        .catch(console.error)
}