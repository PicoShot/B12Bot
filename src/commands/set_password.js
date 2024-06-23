module.exports = {
    name: 'set_password',
    description: 'Set a New Password',
    options: [
        {
            name: 'password_name',
            type: 3,
            description: 'Name The Password',
            required: true,
        },
        {
            name: 'password',
            type: 3,
            description: 'New Password',
            required: true,
        },
    ],
    async execute(interaction) {
        let passwordName = interaction.options.getString('password_name');
        let password = interaction.options.getString('password');
        let msg = `Debug:{${passwordName},${password}}Şifreni kaydettim! (bu sadece bir test mesajı hiç bi boku kaydetmedi.)`;
        await interaction.reply({ content: msg, ephemeral: true });
    },
};
