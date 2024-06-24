module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const pool = require('../includes/sql');
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        // Exclude the /register command from the registration check
        if (interaction.commandName !== 'register') {
            // Check if the user is registered
            const userId = interaction.user.id;
            const [rows] = await pool.execute('SELECT * FROM register WHERE user_id = ?', [userId]);

            if (rows.length === 0 || !rows[0].registered) {
                await interaction.reply({ content: 'You need to register first using the /register command.', ephemeral: true });
                return;
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    },
};
