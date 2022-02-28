const {Command}             = require('discord-akairo')
const {Config, React, Lang} = require('../utils')
const {HarmonyAddress}      = require('@harmony-js/crypto')

class ConvertAddressCommand extends Command
{
    constructor()
    {
        super('convaddr', {
            aliases  : ['convaddr', 'convertaddress'],
            ratelimit: 1,
            args     : [
                {
                    id  : 'address',
                    type: 'string',
                },
            ]
        })
    }

    async exec(message, args)
    {
        try {
            const hmyAddress = new HarmonyAddress(args.address)

            const embed = this.client.util.embed()
                .setColor(Config.get('colors.primary'))
                .addField(`ETH`, '```' + hmyAddress.basicHex + '```')
                .addField(`Harmony`, '```' + hmyAddress.bech32 + '```')

            await message.channel.send(embed)
        } catch (err) {
            await React.error(this, message, Lang.trans(message, 'error.title.error_occurred'), Lang.trans(message, 'error.description.check_address'))
        }
    }
}

module.exports = ConvertAddressCommand