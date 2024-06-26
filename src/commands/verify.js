const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const pool = require('../includes/sql');
const speakeasy = require('speakeasy');

module.exports = {
    name: 'verify',
    description: 'Verify with authentication code and set expiration time',
    options: [
        {
            name: 'auth_code',
            type: 3, // STRING
            description: 'Enter your authentication code',
            required: true,
        },
    ],
    async execute(interaction) {
        const authCode = interaction.options.getString('auth_code');
        const userId = interaction.user.id;

        try {
            // Verify the authentication code
            const [authRow] = await pool.execute('SELECT * FROM auth_keys WHERE user_id = ?', [userId]);

            if (!authRow || !speakeasy.totp.verify({ secret: authRow[0].secret, encoding: 'base32', token: authCode })) {
                await interaction.reply({ content: 'Invalid authentication code. Please try again.', ephemeral: true });
                return;
            }

            // Show select menu for expiration time
            const expirationMenu = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('select_expiration')
                        .setPlaceholder('Select verification expiration time')
                        .addOptions([
                            { label: '1 Minute', value: '1min' },
                            { label: '5 Minutes', value: '5min' },
                            { label: '30 Minutes', value: '30min' },
                            { label: '1 Hour', value: '1hour' },
                            { label: '3 Hours', value: '3hour' },
                            { label: '6 Hours', value: '6hour' },
                            { label: '12 Hours', value: '12hour' },
                            { label: '1 Day', value: '1day' },
                            { label: '3 Days', value: '3day' },
                            { label: '1 Week', value: '1week' },
                            { label: '1 Month', value: '1month' },
                            { label: 'For Ever (Not Secure)', value: 'ever' },
                        ])
                );

            await interaction.reply({
                content: 'Authentication successful! Select how long the verification should last:',
                components: [expirationMenu],
                ephemeral: true,
            });

            const filter = i => i.customId === 'select_expiration' && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

            collector.on('collect', async i => {
                const selectedValue = i.values[0];

                let expiresAt;
                const currentDate = new Date();

                switch (selectedValue) {
                    case '1min':
                        expiresAt = new Date(currentDate.getTime() + 1 * 60000);
                        break;
                    case '5min':
                        expiresAt = new Date(currentDate.getTime() + 5 * 60000);
                        break;
                    case '30min':
                        expiresAt = new Date(currentDate.getTime() + 30 * 60000);
                        break;
                    case '1hour':
                        expiresAt = new Date(currentDate.getTime() + 1 * 3600000);
                        break;
                    case '3hour':
                        expiresAt = new Date(currentDate.getTime() + 3 * 3600000);
                        break;
                    case '6hour':
                        expiresAt = new Date(currentDate.getTime() + 6 * 3600000);
                        break;
                    case '12hour':
                        expiresAt = new Date(currentDate.getTime() + 12 * 3600000);
                        break;
                    case '1day':
                        expiresAt = new Date(currentDate.getTime() + 24 * 3600000);
                        break;
                    case '3day':
                        expiresAt = new Date(currentDate.getTime() + 3 * 24 * 3600000);
                        break;
                    case '1week':
                        expiresAt = new Date(currentDate.getTime() + 7 * 24 * 3600000);
                        break;
                    case '1month':
                        expiresAt = new Date(currentDate.getTime() + 30 * 24 * 3600000);
                        break;
                    case 'ever':
                        expiresAt = new Date(currentDate.getTime() + 5 * 365 * 24 * 3600000);
                        break;
                    default:
                        await i.reply({ content: 'Invalid selection.', ephemeral: true });
                        return;
                }

                try {
                    await pool.execute('REPLACE INTO verify_times (user_id, expires_at) VALUES (?, ?)', [userId, expiresAt]);
                    await i.update({ content: `Verification set to expire in ${selectedValue.replace('min', ' minutes').replace('hour', ' hours').replace('day', ' days').replace('week', ' week')}.`, components: [], ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await i.update({ content: 'There was an error setting the verification expiration time. Please try again later.', components: [], ephemeral: true });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({ content: 'You did not select any expiration time.', components: [], ephemeral: true });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error processing your request. Please try again later.', ephemeral: true });
        }
    },
};
