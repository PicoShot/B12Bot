const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');
const { MessageActionRow, MessageButton } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'import_passwords',
    description: 'Import passwords from a JSON file',
    options: [
        {
            name: 'file',
            type: 11, // ATTACHMENT
            description: 'The JSON file containing your passwords',
            required: true,
        },
    ],
    async execute(interaction) {
        const file = interaction.options.getAttachment('file');
        const userId = interaction.user.id;
        if (!file.name.endsWith('.json')) {
            await interaction.reply({ content: 'Please upload a valid JSON file.', ephemeral: true });
            return;
        }

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

        await interaction.reply({
            content: 'Are you sure you want to import the passwords from the uploaded file?',
            components: [confirmMenu],
            ephemeral: true,
        });

        const filter = i => ['confirm_yes', 'confirm_no'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_yes') {
                try {
                    // Download and read the file
                    const response = await fetch(file.url);
                    const fileData = await response.text();
                    const passwords = JSON.parse(fileData);
                    const secret = ED.md5(process.env.SECRET_KEY + userId);
                    // Validate and insert passwords
                    for (const entry of passwords) {
                        if (entry.password_name && entry.password) {
                            const encryptedPassword = ED.picoEncrypt(entry.password, secret);
                            const [existingRows] = await pool.execute('SELECT * FROM passwords WHERE user_id = ? AND password_name = ?', [interaction.user.id, entry.password_name]);

                            if (existingRows.length > 0) {
                                await pool.execute('UPDATE passwords SET password = ? WHERE user_id = ? AND password_name = ?', [encryptedPassword, interaction.user.id, entry.password_name]);
                            } else {
                                await pool.execute('INSERT INTO passwords (user_id, password_name, password) VALUES (?, ?, ?)', [interaction.user.id, entry.password_name, encryptedPassword]);
                            }
                        }
                    }

                    await interaction.followUp({ content: 'Your passwords have been imported successfully.', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.followUp({ content: 'There was an error importing your passwords.', ephemeral: true });
                }
            } else if (i.customId === 'confirm_no') {
                await i.update({ content: 'Password import canceled.', components: [], ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'You did not respond in time. Password import canceled.', components: [], ephemeral: true });
            }
        });
    },
};
