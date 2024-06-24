const { Modal, TextInputComponent, showModal } = require('discord-modals');
const pool = require('../includes/sql');
const speakeasy = require('speakeasy');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand() && !interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.isCommand()) {
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
        } else if (interaction.isButton()) {
            if (interaction.customId === 'enter_auth_code') {
                const modal = new Modal()
                    .setCustomId('auth_code_modal')
                    .setTitle('Enter Authentication Code')
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId('auth_code')
                            .setLabel('Authentication Code')
                            .setStyle('SHORT')
                            .setMinLength(6)
                            .setMaxLength(6)
                            .setPlaceholder('123456')
                            .setRequired(true)
                    );

                showModal(modal, {
                    client: interaction.client,
                    interaction: interaction,
                });
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'auth_code_modal') {
                const authCode = interaction.fields.getTextInputValue('auth_code'); // Corrected method
                const userId = interaction.user.id;

                try {
                    // Verify the authentication code
                    const [authRow] = await pool.execute('SELECT * FROM auth_keys WHERE user_id = ?', [userId]);

                    if (!authRow || !speakeasy.totp.verify({ secret: authRow[0].secret, encoding: 'base32', token: authCode })) {
                        await interaction.reply({ content: 'Invalid authentication code. Please try again.', ephemeral: true });
                        return;
                    }

                    // Register the user
                    await pool.execute('INSERT INTO register (user_id, registered) VALUES (?, ?)', [userId, true]);
                    await interaction.reply({ content: 'You have been registered successfully!', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'There was an error registering you. Please try again later.', ephemeral: true });
                }
            }
        }
    },
};
