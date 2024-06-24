const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'get_password',
    description: 'Get Your Password',
    options: [],
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Fetch the stored passwords for the user
            const [rows] = await pool.execute('SELECT password_name FROM passwords WHERE user_id = ?', [userId]);

            if (rows.length === 0) {
                await interaction.reply({ content: 'You have no stored passwords.', ephemeral: true });
                return;
            }

            // Create the password name select menu
            const passwordOptions = rows.map(row => ({
                label: row.password_name,
                value: row.password_name,
            }));

            const passwordMenu = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('select_password')
                        .setPlaceholder('Select a password')
                        .addOptions(passwordOptions)
                );

            await interaction.reply({
                content: 'Please select a password name:',
                components: [passwordMenu],
                ephemeral: true,
            });

            const filter = i => i.customId === 'select_password' && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === 'select_password') {
                    const selectedPasswordName = i.values[0];

                    // Create the destination select menu
                    const destinationMenu = new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('select_destination')
                                .setPlaceholder('Select message destination')
                                .addOptions([
                                    {
                                        label: 'DM',
                                        description: 'Send the message via DM',
                                        value: 'dm',
                                    },
                                    {
                                        label: 'Here (Channel)',
                                        description: 'Send the message in the current channel',
                                        value: 'here',
                                    },
                                ])
                        );

                    await i.update({
                        content: `You selected: ${selectedPasswordName}. Now select where to send the message:`,
                        components: [destinationMenu],
                        ephemeral: true,
                    });

                    const destinationFilter = i => i.customId === 'select_destination' && i.user.id === userId;
                    const destinationCollector = interaction.channel.createMessageComponentCollector({ destinationFilter, time: 15000 });

                    destinationCollector.on('collect', async i => {
                        if (i.customId === 'select_destination') {
                            const messageDestination = i.values[0];

                            try {
                                // Fetch the selected password
                                const [passwordRows] = await pool.execute('SELECT password FROM passwords WHERE user_id = ? AND password_name = ?', [userId, selectedPasswordName]);
                                
                                if (passwordRows.length === 0) {
                                    await interaction.followUp({ content: 'Password not found.', ephemeral: true });
                                    return;
                                }

                                const encryptedPassword = passwordRows[0].password;
                                const decryptedPassword = ED.picoDecrypt(encryptedPassword, process.env.SECRET_KEY);

                                const msg = `Your password for ${selectedPasswordName}: ${decryptedPassword}`;

                                if (messageDestination === 'dm') {
                                    await interaction.user.send(msg);
                                } else {
                                    await interaction.followUp({ content: msg, ephemeral: true });
                                }
                            } catch (error) {
                                console.error(error);
                                await interaction.followUp({ content: 'There was an error retrieving your password.', ephemeral: true });
                            }
                        }
                    });

                    destinationCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'You did not select any destination.', components: [], ephemeral: true });
                        }
                    });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({ content: 'You did not select any password name.', components: [], ephemeral: true });
                }
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error fetching your passwords.', ephemeral: true });
        }
    },
};
