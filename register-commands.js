require('dotenv').config();
const { REST , Routes, ApplicationCommandOptionType} = require('discord.js');

const commands = [
    {
      name: 'status',
      description: 'Add Server Listener to Channel',
      options: [
        {
          name: 'name',
          description: 'The name of the server',
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    }
];

const rest = new REST({version: "10"}).setToken(process.env.TOKEN);

(async() => {

    try{
        console.log('Reg')

    await rest.put(
Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    process.env.GUILD_ID
    ),
    { body: commands }
    );
    console.log('confirm')
    } catch {
        console.log(error)
    }
})();