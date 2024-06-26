const ED = require('../includes/EncryptDecrypt');

module.exports = {
    name: 'whois',
    description: 'Tell You Who u are ?',
    options: [],
    async execute(interaction) {
        const userName = interaction.user;
        const userId = interaction.user.id;
        const Token = ED.md5(userName + process.env.SECRET_KEY + userId);
        await interaction.reply({ content: `You are (${userName}) and your discord id is: (${userId}) and your bot Token is: (${Token})`, ephemeral: true });
    },
};
 