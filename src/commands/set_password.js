const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');

module.exports = {
    name: 'set_password',
    description: 'Set a New Password',
    options: [
        {
            name: 'password_name',
            type: 3, // 'STRING'
            description: 'Name The Password',
            required: true,
        },
        {
            name: 'password',
            type: 3, // 'STRING'
            description: 'New Password',
            required: true,
        },
    ],
    async execute(interaction) {
        const userId = interaction.user.id;
        const passwordName = interaction.options.getString('password_name');
        const password = interaction.options.getString('password');
        const EncryptedPassword = ED.xor(password);

        try {
            const [rows, fields] = await pool.execute('INSERT INTO passwords (user_id, password_name, password) VALUES (?, ?, ?)', [userId, passwordName, EncryptedPassword]);
            const msg = `Password saved: ${passwordName}`;
            await interaction.reply({ content: msg, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error saving your password.', ephemeral: true });
        }
    },
};
