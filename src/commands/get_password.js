module.exports = {
    name: 'get_password',
    description: 'Get Your Password',
    options: [
        {
            name: 'password_name',
            type: 3,
            description: 'The Password Name',
            required: true,
        },
    ],
    async execute(interaction) {
        const userId = interaction.user.id;
        let passwordName = interaction.options.getString('password_name');
        let msg = `Debug:{${userId},${passwordName}}bi dur yarram botu daha yapmadık aq`;
        await interaction.reply({ content: msg, ephemeral: true });
    },
};
