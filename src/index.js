const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
    partials: [
        Partials.Channel,
    ],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    registerCommands();
});

const registerCommands = async () => {
    const commands = [
        {
            name: 'hello',
            description: 'Replies with a private message',
        },
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
};

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'hello') {
        await interaction.reply({ content: 'Hello!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
