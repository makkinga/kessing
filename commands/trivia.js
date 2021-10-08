const {Command}                            = require('discord-akairo')
const {Wallet, Config, React, Transaction} = require('../utils')

class TriviaCommand extends Command
{
    constructor()
    {
        super('trivia', {
            aliases  : ['trivia', 'question'],
            ratelimit: 1,
            channel  : 'dm',
        })
    }

    * args(message)
    {
        let failed = false

        const amount = yield {
            id    : 'amount',
            type  : 'number',
            prompt: {
                start  : `How much ${Config.get('token.symbol')} will this question be worth?`,
                timeout: 'Time ran out, your command has been cancelled.',
                cancel : 'Your command has been cancelled.',
                time   : 30000
            }
        }

        const question = yield {
            type  : 'string',
            prompt: {
                start  : `What is the question you would like to ask?`,
                timeout: 'Time ran out, your command has been cancelled.',
                cancel : 'Your command has been cancelled.',
                time   : 30000
            }
        }

        const type = yield {
            type  : ['open', 'multiple choice', 'mc'],
            prompt: {
                start  : `Is it an open or a multiple choice (mc) question?`,
                retry  : `I'm sorry, but that was not one of the options, please try again.`,
                timeout: 'Time ran out, your command has been cancelled.',
                ended  : 'Too many retries, your command has been cancelled.',
                cancel : 'Your command has been cancelled.',
                retries: 4,
                time   : 30000
            }
        }

        let answer  = null
        let answers = null
        if (type === 'open') {
            answers = yield {
                type  : 'string',
                match : 'none',
                prompt: {
                    start   : [
                        'What is the correct answer?',
                        'If there are multiple ways of spelling it (e.g.: foobar and foo-bar) please send them as individual messages',
                        'Type `stop` when you are done.'
                    ],
                    infinite: true
                }
            }
        }

        if (type === 'multiple choice' || type === 'mc') {
            answers = yield {
                match : 'none',
                prompt: {
                    start   : [
                        'Please provide 4 answers.',
                        'Type them as separate messages and make sure the correct answer is the first',
                        'Type `stop` when you are done.'
                    ],
                    infinite: true,
                }
            }

            if (answers.length < 4) {
                message.channel.send(`You didn't type enough answers. The command has been cancelled`)

                failed = true
            }

            answer = answers[0]
            if (answers.length > 4) {
                answers = answers.slice(0, 4)
            }
            answers = answers.sort(() => Math.random() - 0.5)
            answer  = answers.indexOf(answer)
        }

        message.channel.send(`Thank you! I will now send the question in <#${Config.get('channels.trivia')}>!`)

        return {amount, question, type, answer, answers, failed}
    }

    async exec(message, args)
    {
        if (args.failed) {
            return
        }

        let amount    = args.amount
        const command = this

        if (!await Wallet.check(this, message, message.author.id)) {
            await React.error(`You have no wallet`, `In order to place a question you need a wallet`)

            return
        }
        if (amount < 0.01) {
            await React.error(this, message, `Tip amount incorrect`, `The tip amount is too low`)
            return
        }
        const wallet  = await Wallet.get(this, message, message.author.id)
        const balance = await Wallet.balance(wallet, Config.get('token.default'))
        if (parseFloat(amount + 0.001) > parseFloat(balance)) {
            await React.error(this, message, `Insufficient funds`, `The amount exceeds your balance + safety margin (0.001 ${Config.get(`token.symbol`)}). Use the \`${Config.get('prefix')}deposit\` command to get your wallet address to send some more ${Config.get(`token.symbol`)}. Or try again with a lower amount`)
            return
        }
        const from          = wallet.address
        let intervalActive  = true
        const triviaChannel = message.client.channels.cache.get(Config.get('channels.trivia'))

        /* Open Question */
        if (args.type === 'open') {
            const filter = function (response) {
                return args.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase())
            }

            const question = this.client.util.embed()
                .setColor(Config.get('colors.primary'))
                .setThumbnail('https://media.istockphoto.com/vectors/quiz-neon-text-banner-on-brick-wall-questions-team-game-quiz-night-vector-id1223692043?k=6&m=1223692043&s=170667a&w=0&h=zZ_h8N-gJn4YEv2DqxUtQUDU0GLDfH6H1H2b4Fxf-lI=')
                .setTitle(`❓Question by ${message.author.username} for ${amount} ${Config.get('token.symbol')}❓`)
                .setDescription(args.question)
                .setFooter(`Play by sending your answer`)

            await triviaChannel.send('<@&864013236508164118>')
            await triviaChannel.send(question).then(() => {
                let seconds = 30
                triviaChannel.send(`You have 30 seconds left to answer`).then(() => {
                    const interval = setInterval(function () {
                        seconds = seconds - 10

                        if (seconds > 0 && intervalActive) {
                            triviaChannel.send(`${seconds} seconds left`)
                        }
                        if (seconds <= 0) {
                            clearInterval(interval)
                        }
                    }, 10000)
                })

                triviaChannel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
                    .then(collected => {
                        intervalActive = false
                        const answer   = this.client.util.embed()
                            .setColor(Config.get('colors.primary'))
                            .setTitle(`${collected.first().author.username} got the correct answer!`)
                            .setDescription(`${amount} ${Config.get('token.symbol')} will come your way!`)
                        triviaChannel.send(answer)

                        Wallet.recipientAddress(command, message, collected.first().author.id).then(to => {
                            Transaction.addToQueue(command, message, from, to, amount, Config.get('token.default'), collected.first().author.id).then(() => {
                                Transaction.runQueue(command, message, message.author.id, false, true, false, false, true)
                            })
                        })
                    })
                    .catch(collected => {
                        intervalActive = false
                        const answer   = this.client.util.embed()
                            .setColor(Config.get('colors.primary'))
                            .setTitle(`Unfortunately nobody answered correctly`)
                            .setDescription(`The ${amount} ${Config.get('token.symbol')} will be sent back to ${message.author.username}`)
                        triviaChannel.send(answer)
                    })
            })
        }

        /* Multiple Choice Question */
        if (args.type === 'multiple choice' || args.type === 'mc') {
            const answerReactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣']
            const question        = this.client.util.embed()
                .setColor(Config.get('colors.primary'))
                .setThumbnail('https://media.istockphoto.com/vectors/quiz-neon-text-banner-on-brick-wall-questions-team-game-quiz-night-vector-id1223692043?k=6&m=1223692043&s=170667a&w=0&h=zZ_h8N-gJn4YEv2DqxUtQUDU0GLDfH6H1H2b4Fxf-lI=')
                .setTitle(`❓Question by ${message.author.username} for ${amount} ${Config.get('token.symbol')}❓`)
                .setDescription(args.question)
                .setFooter(`Play by clicking on the reaction that matches your answer. Answer only once or you will be disqualified`)

            for (let i = 0; i < args.answers.length; i++) {
                question.addField(`Answer ${answerReactions[i]}`, args.answers[i])
            }

            await triviaChannel.send('<@&864013236508164118>')
            await triviaChannel.send(question).then(sentQuestion => {
                for (let i = 0; i < args.answers.length; i++) {
                    sentQuestion.react(answerReactions[i])
                }

                let seconds = 30
                triviaChannel.send(`You have 30 seconds left to answer`).then(() => {
                    const interval = setInterval(function () {
                        seconds = seconds - 10

                        if (seconds > 0 && intervalActive) {
                            triviaChannel.send(`${seconds} seconds left`)
                        }
                        if (seconds <= 0) {
                            clearInterval(interval)
                        }
                    }, 10000)
                })

                setTimeout(async () => {
                    intervalActive        = false
                    let winners           = sentQuestion.reactions.cache.get(answerReactions[args.answer]).users.cache.filter(user => !user.bot)
                    const losingReactions = sentQuestion.reactions.cache.filter(reaction => reaction.emoji.name !== answerReactions[args.answer])

                    losingReactions.map(reaction => {
                        reaction.users.cache.map(user => {
                            if (!user.bot) {
                                winners.delete(user.id)
                            }
                        })
                    })

                    winners.map(user => {
                        return user.username
                    }).join(', ')

                    const answer = this.client.util.embed()
                        .setColor(Config.get('colors.primary'))
                        .setTitle(`The correct answer was ${answerReactions[args.answer]}`)

                    if (winners.size > 0) {
                        answer.addField(`${amount} ${Config.get('token.symbol')} will be distributed among the following players`, winners.map(user => {
                            return user.username
                        }).join(', '))

                        amount = amount / winners.size

                        winners = winners.array()

                        for (let i = 0; i < winners.length; i++) {
                            const to = await Wallet.recipientAddress(command, message, winners[i].id)
                            
                            await Transaction.addToQueue(command, message, from, to, amount, Config.get('token.default'), winners[i].id)
                        }

                        await Transaction.runQueue(command, message, message.author.id, false, true, false, false, true)
                    } else {
                        answer.addField(`Unfortunately nobody answered correctly`, `The ${amount} ${Config.get('token.symbol')} will be sent back to ${message.author.username}`)
                    }

                    triviaChannel.send(answer)
                }, 30000)
            })
        }
    }
}

module.exports = TriviaCommand