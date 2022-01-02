const {Command}               = require('discord-akairo')
const {Config, React, Wallet} = require('../utils')
const table                   = require('text-table')

class PkeyCommand extends Command
{
    constructor()
    {
        super('pkey', {
            aliases  : ['pkey', 'privatekey'],
            channel  : 'dm',
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        const wallet = await Wallet.get(this, message, message.author.id)

        let addresses = []
        for (const key in Config.get('tokens')) {
            addresses.push([
                Config.get(`tokens.${key}.symbol`),
                Config.get(`tokens.${key}.contract_address`),
            ])
        }

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.error'))
            .setTitle(`Please store this private key in a safe place. This message will be removed in 60 seconds.`)
            .setDescription(`Note: You can import this private key into MetaMask or another wallet. However, never share your private key with anyone else.`)
            .addField(`Your address`, '```' + wallet.address + '```')
            .addField(`Your private key`, '```' + Wallet.privateKey(wallet) + '```')
            .addField(`Contract addresses to import`, '```' + table(addresses) + '```')
        const msg   = await message.author.send(embed)

        setTimeout(async function () {
            await msg.delete()
        }, 60000)
    }
}

module.exports = PkeyCommand