const {Command} = require('discord-akairo')
const {Config}  = require('../utils')

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

        const general = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`General Commands`)
            .addField(`${Config.get('prefix')}deposit`, `Shows your wallet address. If you have no wallet yet a new one will be created for you`)
            .addField(`${Config.get('prefix')}balance`, `Shows your wallet\'s balance`)
            .addField(`${Config.get('prefix')}getgas`, `The bot will send you some gas. This command only works if your gas balance is below 0.01 \nAlias: ${Config.get('prefix')}gasmeup`)
            .addField(`${Config.get('prefix')}price`, `Display the current ${Config.get('token.symbol')} statistics\nAlias: ${Config.get('prefix')}stats ${Config.get('prefix')}statistics`)

        const send = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Send Commands`)
            .addField(`${Config.get('prefix')}send 100 0x89y92...38jhu283h9`, `Send ${tokensSummary} to an external address`)
            .addField(`${Config.get('prefix')}sendmax 0x89y92...38jhu283h9`, `Send all of your ${tokensSummary} to an external address`)

        const tip = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Tip Commands`)
            .addField(`${Config.get('prefix')}tip 100 @user1`, `Send a tip to mentioned user\nAlias: ${Config.get('prefix')}gift ${Config.get('prefix')}give`)
            .addField(`${Config.get('prefix')}tipsplit 100 @user1 @user2`, `Split a tip among mentioned users\nAlias: ${Config.get('prefix')}split ${Config.get('prefix')}splitgift ${Config.get('prefix')}divide ${Config.get('prefix')}tipdivide ${Config.get('prefix')}dividetip`)
            .addField(`${Config.get('prefix')}tiprandom 100`, `Tip a random user from the last 20 messages\nAlias: ${Config.get('prefix')}giftrandom`)
            .addField(`${Config.get('prefix')}rain 100`, `Distribute a tip amongst the users of the last 20 messages`)
            .addField(`${Config.get('prefix')}tipstats`, `Display the tipping stats top 10\nAlias: ${Config.get('prefix')}tipstatistics`)
            .addField(`${Config.get('prefix')}legends`, `Display the legendary bèta tipping top 10`)

        const burn = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Burn Commands`)
            .addField(`${Config.get('prefix')}burn 100`, `Burn tokens`)
            .addField(`${Config.get('prefix')}burnstats`, `Display the burning stats top 10\nAlias: ${Config.get('prefix')}burnstatistics`)

        const stake = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Staking Commands`)
            .addField(`${Config.get('prefix')}stake 100`, `Stake the given amount of ${Config.get('token.symbol')}. If no amount is provided the total ${Config.get('token.symbol')} balance will be staked`)
            .addField(`${Config.get('prefix')}unstake 100`, `Unstake the given amount of ${Config.get('token.symbol')}. If no amount is provided the total ${Config.get('token.symbol')} balance will be unstaked`)
            .addField(`${Config.get('prefix')}claim`, `Claim your earned rewards. Your total reward balance will be sent to your wallet`)
            .addField(`${Config.get('prefix')}stakebalance`, `Shows your staked ${Config.get('token.symbol')} and reward balance \nAlias: ${Config.get('prefix')}staked`)

        const trivia = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Trivia Commands`)
            .addField(`${Config.get('prefix')}trivia`, `This command will start a quiz question in #📚trivia-games. I will ask you for some information that I need to set it up. When we're done I will place the question and start a countdown. When it ends I will reward all of the winning answers`)

        const misc = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Miscellaneous Commands`)
            .addField(`${Config.get('prefix')}optin`, `A wai to opt-in to the Degen or Trivia role\nAlias: ${Config.get('prefix')}opt-in ${Config.get('prefix')}countmein`)
            .addField(`${Config.get('prefix')}optout`, `A wai to opt-out of the Degen or Trivia role\nAlias: ${Config.get('prefix')}opt-out ${Config.get('prefix')}imout`)
            .addField(`${Config.get('prefix')}version`, `Show the current tipbot version\nAlias: ${Config.get('prefix')}v`)
            .addField(`${Config.get('prefix')}ping`, `Responds with "pong!" when the bot is online`)
            .addField(`${Config.get('prefix')}degen`, `Fake command the bot will react to with a ✅ \n These commands are only available in #🤪degen-chat\nAlias: ${Config.get('prefix')}slarp ${Config.get('prefix')}slurp ${Config.get('prefix')}dip ${Config.get('prefix')}rug ${Config.get('prefix')}rugpull ${Config.get('prefix')}burnall`)

        const multiToken = this.client.util.embed()
            .setColor(Config.get('colors.primary'))
            .setTitle(`Multi token`)
            .setDescription(`You can use either ${tokensSummary} for tipping. To tip with a different token use this format: \`${Config.get('prefix')}[command] [amount] [token] [optional: address]\`. If no token is defined, the bot will use it's default token (${Config.get('token.symbol')})`)

        const info = this.client.util.embed()
            .setColor(Config.get('colors.info'))
            .setTitle(`:information_source: Cooldown`)
            .setDescription(`In order to prevent spamming there is a cooldown period of ${parseFloat(Config.get('cooldown')) / 1000} seconds per command per user.`)

        await message.author.send(general)
        await message.author.send(send)
        await message.author.send(tip)
        await message.author.send(burn)
        await message.author.send(stake)
        await message.author.send(trivia)
        await message.author.send(misc)
        await message.author.send(multiToken)
        await message.author.send(info)
    }
}

module.exports = HelpCommand