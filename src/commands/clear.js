const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Clear bot messages from your DM',
    options: [
        {
            name: 'number',
            type: 4, // INTEGER
            description: 'Number of messages to delete',
            required: true,
            choices: [
                {
                    name: '1',
                    value: 5,
                },
                {
                    name: '5',
                    value: 10,
                },
                {
                    name: '10',
                    value: 15,
                },
                {
                    name: '20',
                    value: 15,
                },
            ],
        },
    ],
    async execute(interaction) {
        const number = interaction.options.getInteger('number');

        try {
            // Fetch user's DM channel
            const user = await interaction.user.fetch();
            const dmChannel = await user.createDM();

            // Fetch bot's messages in the DM channel
            const messages = await dmChannel.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(msg => msg.author.id === interaction.client.user.id);

            // Delete specified number of bot messages
            const messagesToDelete = botMessages.first(number);
            for (const message of messagesToDelete) {
                await message.delete();
            }

            const msg = `Deleted ${messagesToDelete.length} messages from your DM.`;
            await interaction.reply({ content: msg, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error deleting messages from your DM.', ephemeral: true });
        }
    },
};
