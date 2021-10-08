const {Command}                        = require('discord-akairo')
const {Config, React, Wallet, Staking} = require('../utils')
const table                            = require('text-table')

class BalanceCommand extends Command
{
    constructor()
    {
        super('balance', {
            aliases  : ['balance'],
            channel  : 'dm',
            ratelimit: 1,
        })
    }

    async exec(message)
    {
        await React.processing(message)
        if (!await Wallet.check(this, message, message.author.id)) {
            return
        }
        const wallet     = await Wallet.get(this, message, message.author.id)
        const gasBalance = await Wallet.gasBalance(wallet)

        let rows = []

        for (const key in Config.get('tokens')) {
            const balance = await Wallet.balance(wallet, key)
            rows.push([Config.get(`tokens.${key}.symbol`), `${balance} ${Config.get(`tokens.${key}.symbol`)}`])
        }

        rows.push(null)
        rows.push([`ONE`, `${gasBalance} ONE`])
        rows.push(null)
        
        if (process.env.ENVIRONMENT === 'production') {
            if (await Staking.status(wallet.address)) {
                const balance       = await Staking.balance(wallet.address)
                const rewardBalance = await Staking.rewardBalance(wallet.address)

                rows.push([`Staked ${Config.get(`token.symbol`)}`, `${balance} ${Config.get(`token.symbol`)}`])
                rows.push([`Staking rewards`, `${rewardBalance} ${Config.get(`token.symbol`)}`])
            }
        }

        const tableRows = []
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] === null) {
                tableRows.push([])
            } else {
                tableRows.push([
                    rows[i][0],
                    ':',
                    rows[i][1],
                ])
            }
        }

        const embed = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Your balances`)
            .setDescription('```' + table(tableRows) + '```')

        await React.done(message)

        await message.author.send(embed)
    }
}

module.exports = BalanceCommand