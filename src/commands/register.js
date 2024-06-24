const pool = require('../includes/sql');

module.exports = {
    name: 'register',
    description: 'Register to use the bot',
    options: [],
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Check if the user is already registered
            const [rows] = await pool.execute('SELECT * FROM register WHERE user_id = ?', [userId]);

            if (rows.length > 0) {
                await interaction.reply({ content: 'You are already registered.', ephemeral: true });
                return;
            }

            // Register the user
            await pool.execute('INSERT INTO register (user_id, registered) VALUES (?, ?)', [userId, true]);
            await interaction.reply({ content: 'You have been registered successfully!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error registering you. Please try again later.', ephemeral: true });
        }
    },
};
