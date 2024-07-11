require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
  {
    name: 'characters',
    description: 'Lookup of Character/ Discord @',
    options: [
      {
        name: 'user',
        description: 'Discord @',
        type: ApplicationCommandOptionType.User,
        required: true
      },
    ]
  },
  {
    name: 'server',
    description: 'ServerNumber',
    options: [
      {
        name: 'name',
        description: 'Discord @',
        type: ApplicationCommandOptionType.String,
        required: true
      },
    ]
  },
  {
    name: 'invite',
    description: 'Adds Character to list',
    options: [
      {
        name: 'user',
        description: 'Discord @',
        type: ApplicationCommandOptionType.User,
        required: true
      },
      {
        name: 'character',
        description: 'Character Name',
        type: ApplicationCommandOptionType.String,
        required: true
      },
      {
        name: 'server',
        description: 'Server Number',
        type: ApplicationCommandOptionType.String,
        required: true
      },
    ]
  },
  {
    name: 'watch',
    description: 'Setup Server Watcher',
    options: [
      {
        name: 'name',
        description: 'Server Number',
        type: ApplicationCommandOptionType.String,
        required: true
      },
    ]
  },
  {
    name: 'remove',
    description: 'Deletes Character',
    options: [
      {
        name: 'user',
        description: 'Discord @',
        type: ApplicationCommandOptionType.User,
        required: true
      },
      {
        name: 'character',
        description: 'Character Name',
        type: ApplicationCommandOptionType.String,
        required: true
      },
      {
        name: 'server',
        description: 'Server Number',
        type: ApplicationCommandOptionType.String,
        required: true
      },
    ]
  },
  {
    name: 'watcherclear',
    description: 'Clears Watcher in chanel',
  },
  {
    name: 'checklist',
    description: 'Create Checklist anyone can check off',
    options: [
      {
        name: 'items',
        description: 'Seperate with ,',
        type: ApplicationCommandOptionType.String,
        required: true
      },
    ]
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

  try {
    console.log('Reg')
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('confirm')
  } catch (error) {
    console.log(error)
  }
})();