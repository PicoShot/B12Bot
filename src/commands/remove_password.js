const pool = require('../includes/sql');
const { MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js');

module.exports = {
    name: 'remove_password',
    description: 'Remove a stored password',
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
                content: 'Please select a password name to remove:',
                components: [passwordMenu],
                ephemeral: true,
            });

            const filter = i => i.customId === 'select_password' && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === 'select_password') {
                    const selectedPasswordName = i.values[0];

                    // Create the confirmation menu
                    const confirmMenu = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('confirm_yes')
                                .setLabel('Yes')
                                .setStyle('DANGER'),
                            new MessageButton()
                                .setCustomId('confirm_no')
                                .setLabel('No')
                                .setStyle('SECONDARY')
                        );

                    await i.update({
                        content: `Are you sure you want to remove the password for ${selectedPasswordName}?`,
                        components: [confirmMenu],
                        ephemeral: true,
                    });

                    const confirmFilter = i => ['confirm_yes', 'confirm_no'].includes(i.customId) && i.user.id === userId;
                    const confirmCollector = interaction.channel.createMessageComponentCollector({ confirmFilter, time: 15000 });

                    confirmCollector.on('collect', async i => {
                        if (i.customId === 'confirm_yes') {
                            try {
                                // Remove the selected password
                                await pool.execute('DELETE FROM passwords WHERE user_id = ? AND password_name = ?', [userId, selectedPasswordName]);
                                await i.update({ content: `Password for ${selectedPasswordName} has been removed.`, components: [], ephemeral: true });
                            } catch (error) {
                                console.error(error);
                                await i.update({ content: 'There was an error removing the password.', components: [], ephemeral: true });
                            }
                        } else if (i.customId === 'confirm_no') {
                            await i.update({ content: 'Password removal canceled.', components: [], ephemeral: true });
                        }
                    });

                    confirmCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'You did not respond in time. Password removal canceled.', components: [], ephemeral: true });
                        }
                    });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({ content: 'You did not select any password name. Password removal canceled.', components: [], ephemeral: true });
                }
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error fetching your passwords.', ephemeral: true });
        }
    },
};
