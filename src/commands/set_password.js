const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    name: 'set_password',
    description: 'Update or Set a New Password',
    options: [
        {
            name: 'password_name',
            type: 3, // STRING
            description: 'Name The Password',
            required: true,
        },
        {
            name: 'password',
            type: 3, // STRING
            description: 'New Password',
            required: true,
        },
    ],
    async execute(interaction) {
        const userId = interaction.user.id;
        const passwordName = interaction.options.getString('password_name').toUpperCase();
        const password = interaction.options.getString('password');
        const encryptedPassword = ED.xorEncryptDecrypt(password, 'mysecretkey'); // Replace 'mysecretkey' with your actual key

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('select')
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
                    ]),
            );

        await interaction.reply({
            content: 'Please select where to send the message:',
            components: [row],
            ephemeral: true,
        });

        const filter = i => i.customId === 'select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'select') {
                const messageDestination = i.values[0];

                try {
                    const [existingRows] = await pool.execute('SELECT * FROM passwords WHERE user_id = ? AND password_name = ?', [userId, passwordName]);

                    if (existingRows.length > 0) {
                        await pool.execute('UPDATE passwords SET password = ? WHERE user_id = ? AND password_name = ?', [encryptedPassword, userId, passwordName]);
                        var msg = `Password updated: ${passwordName}`;
                    } else {
                        await pool.execute('INSERT INTO passwords (user_id, password_name, password) VALUES (?, ?, ?)', [userId, passwordName, encryptedPassword]);
                        var msg = `Password saved: ${passwordName}`;
                    }

                    if (messageDestination === 'dm') {
                        await interaction.user.send(msg);
                        await interaction.editReply({ content: "Success!", components: [], ephemeral: true });
                    } else {
                        await interaction.editReply({ content: msg, components: [], ephemeral: true });
                    }
                } catch (error) {
                    console.error(error);
                    await interaction.editReply({ content: 'There was an error saving your password.', components: [], ephemeral: true });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'You did not select any destination.', components: [], ephemeral: true });
            }
        });
    },
};
