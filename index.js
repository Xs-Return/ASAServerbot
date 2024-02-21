require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, Embed } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

const fs = require('fs');

// Function to read server channels data from JSON file
function readServerChannels() {
    try {
        const data = fs.readFileSync('server-channels.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading server channels file:', err);
        return [];
    }
}

// Function to write server channels data to JSON file
function writeServerChannels(serverChannels) {
    try {
        fs.writeFileSync('server-channels.json', JSON.stringify(serverChannels, null, 2));
        console.log('Server channels data saved successfully.');
    } catch (err) {
        console.error('Error writing server channels file:', err);
    }
}


// Function to fetch data from the JSON file
function fetchData() {
  fetch('https://cdn2.arkdedicated.com/servers/asa/officialserverlist.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
      
    })
    .then(data => {
      // Call the processData function with the fetched data
      processData(data);
    })
    .catch(error => {
      console.error('There was a problem fetching the data:', error);
    });
}

// Define a map to store the previous NumPlayers value for each server
const previousNumPlayers = new Map();

// Function to process the received JSON data
async function processData(data) {
  let serverChannels = readServerChannels();
    const desiredNames = serverChannels.map(pair => pair.serverName); // Extract server names from serverChannels array
    
    // Filter entries based on server names from serverChannels
    const filteredEntries = data.filter(entry => desiredNames.includes(entry.Name));

    // Iterate over each server-channel pair in serverChannels
    for (const pair of serverChannels) {
        const serverName = pair.serverName;
        const channelId = pair.channelId;

        // Filter entries for the current server name
        const filteredEntriesForServer = filteredEntries.filter(entry => entry.Name === serverName);

        // Fetch the channel
        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            console.error(`Channel not found: ${channelId}`);
            continue;
        }

        // Get the previous NumPlayers value for this server
        const previousValue = previousNumPlayers.get(channelId);

        // Get the current NumPlayers value for this server
        const currentValue = filteredEntriesForServer.length > 0 ? filteredEntriesForServer[0].NumPlayers : null;

        // Compare current and previous values
        if (currentValue !== previousValue) {
            // Update the previous value with the current one
            previousNumPlayers.set(channelId, currentValue);

            // Create a new embed
            const embed = new EmbedBuilder()
                .setTitle(`${serverName}`);

            // Add fields for each filtered entry
            filteredEntriesForServer.forEach(entry => {
                const numPlayers = entry.NumPlayers;
                const maxPlayers = entry.MaxPlayers;
                embed.addFields({ name: "Players:", value: "```"+`${numPlayers}/${maxPlayers}`+"```",inline: true},{ name: "Map:", value: "```"+`${entry.MapName}`+"```",inline: true},{ name: "Day:", value: "```"+`${entry.DayTime}`+"```",inline: true},{ name: "IP:", value: "```"+`${entry.IP}:${entry.Port}`+"```",inline: true});
                embed.setTimestamp()
                embed.setAuthor({ name: 'Sheogorath', iconURL: 'https://imgur.com/RlyINGK.png'})
                embed.setFooter({ text: `v${entry.BuildId}.${entry.MinorBuildId}`,})
            });

            // Edit the message with the updated embed
            try {
                const messages = await channel.messages.fetch({ limit: 1 });
                const lastMessage = messages.first();
                if (lastMessage) {
                    await lastMessage.edit({ embeds: [embed] });
                    console.log(`Embed updated successfully in ${channel.name} (${channelId})`);
                } else {
                    await channel.send({ embeds: [embed] });
                    console.log(`Embed sent successfully to ${channel.name} (${channelId})`);
                }
            } catch (error) {
                console.error(`Error updating/embedding message in channel ${channelId}: ${error}`);
            }
        } else {
            console.log(`NumPlayers value has not changed for ${serverName}, skipping update`);
        }
    }
}





//CoomandListener
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'status') {
    let serverChannels = readServerChannels();
      const serverName = interaction.options.getString('name');
      const channelId = interaction.channelId;
      serverChannels.push({ serverName, channelId });
      writeServerChannels(serverChannels);
      await interaction.reply(`Server "${serverName}" added to the list. in channel "${channelId}"`);
  }
});

// When the bot is ready, start fetching data
client.once('ready', () => {
  console.log('Bot is ready');
  fetchData();
  setInterval(fetchData, 10000); // Fetch data every 5 seconds
});

// Log in to Discord with your bot token
client.login(process.env.TOKEN);
