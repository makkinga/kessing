const {Command}        = require('discord-akairo')
const {Config, React}  = require('../utils')
const {HarmonyAddress} = require('@harmony-js/crypto')

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
            await React.error(this, message, `An error has occurred`, `Please check if the address is correct`)
        }
    }
}

module.exports = ConvertAddressCommand