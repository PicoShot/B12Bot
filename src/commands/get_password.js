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
        let passwordName = interaction.options.getString('password_name');
        let msg = `Debug:{${passwordName}}bi dur yarram botu daha yapmadık aq`;
        await interaction.reply({ content: msg, ephemeral: true });
    },
};
