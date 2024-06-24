const pool = require('../includes/sql');
const { generateSecret, generateQRCode } = require('../includes/qr');
const speakeasy = require('speakeasy');
const fs = require('fs');
const path = require('path');
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'register',
    description: 'Register to use the bot',
    async execute(interaction) {
        const userId = interaction.user.id;
        const filePath = path.join(__dirname, `../temp/${userId}_authenticator.png`);

        try {
            // Check if the user is already registered
            const [rows] = await pool.execute('SELECT * FROM register WHERE user_id = ?', [userId]);

            if (rows.length > 0) {
                await interaction.reply({ content: 'You are already registered.', ephemeral: true });
                return;
            }

            // Generate and store the Google Authenticator secret
            const secretKey = process.env.SECRET_KEY;
            const secret = generateSecret(userId, secretKey);
            await pool.execute('INSERT INTO auth_keys (user_id, secret) VALUES (?, ?)', [userId, secret.base32]);

            // Generate the QR code buffer
            const qrCodeBuffer = await generateQRCode(secret);
            fs.writeFileSync(filePath, qrCodeBuffer);

            // Send the QR code to the user
            await interaction.user.send({ content: 'Scan this QR code with your Google Authenticator app.', files: [{ attachment: filePath, name: 'authenticator.png' }] });

            // Create a button for the user to click to enter their authentication code
            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId('enter_auth_code')
                    .setLabel('Enter Authentication Code')
                    .setStyle('PRIMARY')
            );

            await interaction.reply({ content: 'Check your DMs for the QR code. Click the button below to enter the authentication code.', components: [row], ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error registering you. Please try again later.', ephemeral: true });
        } finally {
            // Clean up the temporary file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    },
};
