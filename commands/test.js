const {SlashCommandBuilder} = require('@discordjs/builders')
const {Helpers}             = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`test`)
        .setDescription(`Test 123`),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})


        if (await requires(false, 'oops')) return
        
        console.log('foo'); // REMOVE

        // if (await requires(false, 'oops')) return

        // // Checks
        // if (await Helpers.require(interaction, false, `Oops`, `an error`)) return
        //
        // console.log('foo') // REMOVE

        // Send embeds
        await interaction.editReply({content: 'foobar'})
    }
}