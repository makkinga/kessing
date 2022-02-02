require('dotenv').config()
const fs                                          = require('fs')
const {Client, Collection, Intents, MessageEmbed} = require('discord.js')
const {Token, Config, DB, React}                  = require('./utils')
const moment                                      = require("moment")
const {Op}                                        = require("sequelize")

// Create a new client instance
const client = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS
    ],
    partials: ['GUILD_MESSAGES', 'GUILDS', 'GUILD_MESSAGE_REACTIONS', 'USER', 'GUILD_MEMBER', 'GUILD_MEMBERS'],
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
        console.error(error)
        return await React.error(interaction, 6, `An error has occurred`, `Please contact ${Config.get('error_reporting_users')}`, true)
    }
})

// Greet new members
// client.on('guildMemberAdd', member => {
//     client.channels.fetch(Config.get('channels.general')).then(channel => {
//         channel.send(`Hi there <@${member.id}>, Welcome to Freyala! May I recommend visiting our City Tour Guide: https://docs.freyala.com/freyala`)
//     })
// })

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN).then(async () => {
    console.log('Ready!')

    await DB.syncDatabase()

    await sendReminders()
    await getPrice()
    await setPresence()
    setInterval(sendReminders, 30000)
    setInterval(getPrice, 60000)
    setInterval(setPresence, 5000)
})

// Send reminders
async function sendReminders()
{
    const reminders = await DB.reminders.findAll({where: {timestamp: {[Op.lt]: moment().unix()}}})

    for (let i = 0; i < reminders.length; i++) {
        const embed = new MessageEmbed()
            .setColor(Config.get('colors.primary'))
            .setThumbnail(Config.get('token.thumbnail'))
            .setTitle(`Let me remind you of`)
            .setDescription(reminders[i].message)

        await client.users.cache.get(reminders[i].user).send({embeds: [embed]})

        await DB.reminders.destroy({where: {id: reminders[i].id}})
    }
}

// Set price presence
let priceUsd = 0
let priceOne = 0
let presence = 'usd'

async function setPresence()
{
    if (presence === 'usd') {
        await client.user.setPresence({activities: [{name: `${Config.get('token.symbol')} at ${priceOne} ONE`, type: 3}]})

        presence = 'one'
    } else {
        await client.user.setPresence({activities: [{name: `${Config.get('token.symbol')} at $${priceUsd}`, type: 3}]})

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