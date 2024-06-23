module.exports = {
    name: 'whois',
    description: 'Tell You Who u are ?',
    options: [],
    async execute(interaction) {
        await interaction.reply({ content: 'sen tam bir o.ç\'sun', ephemeral: true });
    },
};
