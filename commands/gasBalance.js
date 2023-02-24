const {SlashCommandBuilder} = require('discord.js')
const {ethers}              = require('ethers')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gas-balance')
        .setDescription('Kessing\'s gas balance'),

    async execute(interaction)
    {
        // Defer reply
        await interaction.deferReply({ephemeral: true})

        // Get balance
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
        const signer   = new ethers.Wallet(process.env.BOT_PKEY, provider)
        let balance    = await provider.getBalance(signer.address)
        balance        = ethers.utils.formatEther(balance)

        // Reply
        await interaction.editReply({content: `${parseFloat(balance).toFixed(2)} JEWEL`})
    },
}