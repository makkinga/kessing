const {Command}      = require('discord-akairo')
const {Config, Lang} = require('../utils')

class HelpCommand extends Command
{
    constructor()
    {
        super('help', {
            aliases  : ['help'],
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        let tokensSummary = ''
        let i             = 1
        for (const [key, token] of Object.entries(Config.get('tokens'))) {
            if (i++ === Object.entries(Config.get('tokens')).length) {
                tokensSummary += ` or ${token.symbol}`
            } else {
                tokensSummary += ` ${token.symbol},`
            }
        }

        const help = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .addField(`${Config.get('prefix')}deposit`, Lang.trans(message, 'help.deposit'))
            .addField(`${Config.get('prefix')}balance`, Lang.trans(message, 'help.balance'))
            .addField(`${Config.get('prefix')}getgas`, Lang.trans(message, 'help.getgas'))

            .addField(`${Config.get('prefix')}send 100 0x89y92...38jhu283h9`, Lang.trans(message, 'help.send'))
            .addField(`${Config.get('prefix')}sendmax 0x89y92...38jhu283h9`, Lang.trans(message, 'help.sendmax'))
            .addField(`${Config.get('prefix')}pkey`, Lang.trans(message, 'help.pkey'))

            .addField(`${Config.get('prefix')}tip 100 ${Lang.trans(message, 'user')}1`, Lang.trans(message, 'help.tip'))
            .addField(`${Config.get('prefix')}tipsplit 100 ${Lang.trans(message, 'user')}1 ${Lang.trans(message, 'user')}2`, Lang.trans(message, 'help.tipsplit'))
            .addField(`${Config.get('prefix')}tiprandom 100`, Lang.trans(message, 'help.tiprandom'))
            .addField(`${Config.get('prefix')}rain 100`, Lang.trans(message, 'help.rain'))
            .addField(`${Config.get('prefix')}tipstats`, Lang.trans(message, 'help.tipstats'))

            .addField(`${Config.get('prefix')}burn 100`, Lang.trans(message, 'help.burn'))
            .addField(`${Config.get('prefix')}burnstats`, Lang.trans(message, 'help.burnstats'))

            .addField(`${Config.get('prefix')}version`, Lang.trans(message, 'help.version'))
            .addField(`${Config.get('prefix')}ping`, Lang.trans(message, 'help.ping'))

            .addField(`${Config.get('prefix')}hero 123`, Lang.trans(message, 'help.hero'))

        const info = this.client.util.embed()
            .setColor(Config.get('colors.info'))
            .setTitle(`:information_source: ${Lang.trans(message, 'help.cooldown_title')}`)
            .setDescription(Lang.trans(message, 'help.cooldown_description', {cooldown: (parseFloat(Config.get('cooldown')) / 1000)}))

        await message.author.send(help)
        await message.author.send(info)
    }
}

module.exports = HelpCommand