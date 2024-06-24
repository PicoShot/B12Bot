const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');
const { MessageActionRow, MessageAttachment, MessageButton, MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'import_passwords',
    description: 'Import passwords from a JSON file',
    options: [],
    async execute(interaction) {
        // Prompt the user to upload a JSON file
        await interaction.reply({
            content: 'Please upload your JSON file with passwords.',
            components: [],
            ephemeral: true,
        });

        // Wait for the file upload
        const filter = m => m.author.id === interaction.user.id && m.attachments.size > 0;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async m => {
            const attachment = m.attachments.first();

            if (attachment && attachment.name.endsWith('.json')) {
                try {
                    // Download and read the file
                    const fileData = await downloadFile(attachment.url);
                    const passwords = JSON.parse(fileData);

                    // Validate and insert passwords
                    for (const entry of passwords) {
                        if (entry.password_name && entry.password) {
                            const secret = ED.md5(process.env.SECRET_KEY + userId)
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
            } else {
                await interaction.followUp({ content: 'Please upload a valid JSON file.', ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'You did not upload any file. Password import canceled.', components: [], ephemeral: true });
            }
        });
    },
};

// Function to download the file from the URL
async function downloadFile(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
    return await res.text();
}
