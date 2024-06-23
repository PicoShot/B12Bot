const { Client, GatewayIntentBits, Partials, REST, Routes, ActivityType } = require('discord.js');
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
    client.user.setPresence({
        activities: [{ name: 'Owener => PicoShot', type: ActivityType.Playing }],
        status: 'online',
    });
    registerCommands();
});

const registerCommands = async () => {
    const commands = [
        {
            name: 'set_password',
            description: 'Set a New Password',
            options: [
                {
                    name: 'password_name',
                    type: 3,
                    description: 'Name The Password',
                    required: true,
                },
                {
                    name: 'password',
                    type: 3,
                    description: 'New Password',
                    required: true,
                },
            ],
        },
        {
            name: 'get_password',
            description: 'Get Your Password',
            options: [
                {
                    name: 'password_name',
                    type: 3,
                    description: 'The Password Name',
                    required: true,
                },
            ],
        },
        {
            name: 'whois',
            description: 'Tell You Who u are ?',
            options: [],
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

    const { commandName, options } = interaction;

    if (commandName === 'set_password') {

        let passwordName = options.getString('password_name');
        let password = options.getString('password');
        let msg = `Debug:{${passwordName},${password}}Şifreni kaydettim! (bu sadece bir test mesajı hiç bi boku kaydetmedi.)`

        await interaction.reply({ content: msg, ephemeral: true });
    }
    else if (commandName === 'get_password') {

        let passwordName = options.getString('password_name');
        let msg = `Debug:{${passwordName}}bi dur yarram botu daha yapmadık aq`

        await interaction.reply({ content: msg, ephemeral: true });
    }
    else if (commandName === 'whois') {

        await interaction.reply({ content: 'sen tam bir o.ç\'sun', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
