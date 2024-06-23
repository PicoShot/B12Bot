const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');

module.exports = {
    name: 'set_password',
    description: 'Update or Set a New Password',
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
    async execute(interaction) {
        const userId = interaction.user.id;
        const passwordName = interaction.options.getString('password_name').toUpperCase();
        const password = interaction.options.getString('password');
        const EncryptedPassword = ED.xor(password);

        try {
            const [existingRows, existingFields] = await pool.execute('SELECT * FROM passwords WHERE user_id = ? AND password_name = ?', [userId, passwordName]);

            if (existingRows.length > 0) {
                await pool.execute('UPDATE passwords SET password = ? WHERE user_id = ? AND password_name = ?', [EncryptedPassword, userId, passwordName]);
                let msg = `Password Updated: ${passwordName}`;
            } else {
                let msg = `Password saved: ${passwordName}`;
                await pool.execute('INSERT INTO passwords (user_id, password_name, password) VALUES (?, ?, ?)', [userId, passwordName, EncryptedPassword]);
            }
                await interaction.reply({ content: msg, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error saving your password.', ephemeral: true });
        }
    },
};
