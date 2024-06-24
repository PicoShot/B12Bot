const fs = require('fs');
const pool = require('../includes/sql');
const ED = require('../includes/EncryptDecrypt');
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'export_passwords',
    description: 'Export all your passwords as a JSON file',
    options: [],
    async execute(interaction) {
        const userId = interaction.user.id;

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
            content: 'Are you sure you want to export all your passwords?',
            components: [confirmMenu],
            ephemeral: true,
        });

        const filter = i => ['confirm_yes', 'confirm_no'].includes(i.customId) && i.user.id === userId;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_yes') {
                try {
                    // Fetch all stored passwords for the user
                    const [rows] = await pool.execute('SELECT password_name, password FROM passwords WHERE user_id = ?', [userId]);
                    const secret = ED.md5(process.env.SECRET_KEY + userId)
                    // Decrypt passwords
                    const decryptedPasswords = rows.map(row => ({
                        password_name: row.password_name,
                        password: ED.picoDecrypt(row.password, secret)
                    }));

                    // Write passwords to a JSON file
                    const filePath = `./exports/${userId}_passwords.json`;
                    fs.writeFileSync(filePath, JSON.stringify(decryptedPasswords, null, 2));

                    await interaction.user.send({
                        content: 'Here is your exported passwords file.',
                        files: [filePath]
                    });

                    await i.update({ content: 'Your passwords have been exported and sent to you in a DM.', components: [], ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await i.update({ content: 'There was an error exporting your passwords.', components: [], ephemeral: true });
                }
            } else if (i.customId === 'confirm_no') {
                await i.update({ content: 'Password export canceled.', components: [], ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'You did not respond in time. Password export canceled.', components: [], ephemeral: true });
            }
        });
    },
};
