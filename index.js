require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, Events, Partials } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const fs = require('fs');
const SharedData = {
    nameArray: [],
}
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


    return new Promise((resolve, reject) => {
        fetch('https://cdn2.arkdedicated.com/servers/asa/officialserverlist.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Resolve the promise with the fetched data
                resolve(data);
                processData(data);
            })
            .catch(error => {
                // Reject the promise if there was an error fetching the data
                reject(error);
            });
    });
}

// Define a map to store the previous NumPlayers value for each server
const previousNumPlayers = new Map();

// Function to process the received JSON data
async function processData(data) {
  let serverChannels = readServerChannels();
    const desiredNames = serverChannels.map(pair => pair.serverName); // Extract server names from serverChannels array
    this.nameArray = data.map(obj => obj.Name);
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
            const idx = serverChannels.findIndex(element => element.channelId === channelId)
            serverChannels.splice(idx,1)
            console.log(serverChannels)
            console.log(`Channel not found: ${channelId} Removing from Array.`);
            writeServerChannels(serverChannels);

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
                if (lastMessage && lastMessage.author.id === client.user.id) {
                    await lastMessage.edit({ embeds: [embed] });
                    console.log(`Embed updated successfully in ${channel.name} (${channelId})`);
                } else {
                    await channel.send({ embeds: [embed] });
                    console.log(`Embed sent successfully to ${channel.name} (${channelId})`);
                }
            } catch (error) {
                console.error(`Error updating/embedding message in channel ${channelId}: ${error}`);
            }
        }
    }
}





//CoomandListener
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'watch') {
    let serverChannels = readServerChannels();
    const partialserverName = interaction.options.getString('name');
    const channelId = interaction.channelId;
    const serverName = nameArray.find(name => name.includes(partialserverName));
    if (!serverName){
        try {
            await interaction.reply({ content: 'Cant Finder Server Info', ephemeral: true });
            return console.log("badName")
        }
        catch {return console.log("NoPerms")}
      
    } 
    serverChannels.push({ serverName, channelId });
    writeServerChannels(serverChannels);
    try {
    await interaction.reply({ content: `Server ${serverName} added to the list.`, ephemeral: true });
}
catch {return console.log("NoPerms")}
  } 
  else if (interaction.commandName === 'server') {
    const partialserverName = interaction.options.getString('name');
    const serverName = nameArray.find(name => name.includes(partialserverName));
    if (!serverName){
        try {
            await interaction.reply({ content: 'Cant Finder Server Info', ephemeral: true });
            return console.log("badName")
        }
        catch {return console.log("NoPerms")}
    }
    fetchData()
    .then(data => {
        const filteredEntries = data.filter(entry => serverName.includes(entry.Name));
const embed = new EmbedBuilder()
                .setTitle(`${serverName}`);

            // Add fields for each filtered entry
                const numPlayers = filteredEntries[0].NumPlayers;
                const maxPlayers = filteredEntries[0].MaxPlayers;
                embed.addFields({ name: "Players:", value: "```"+`${numPlayers}/${maxPlayers}`+"```",inline: true},{ name: "Map:", value: "```"+`${filteredEntries[0].MapName}`+"```",inline: true},{ name: "Day:", value: "```"+`${filteredEntries[0].DayTime}`+"```",inline: true},{ name: "IP:", value: "```"+`${filteredEntries[0].IP}:${filteredEntries[0].Port}`+"```",inline: true});
                embed.setTimestamp()
                embed.setAuthor({ name: 'Sheogorath', iconURL: 'https://imgur.com/RlyINGK.png'})
                embed.setFooter({ text: `v${filteredEntries[0].BuildId}.${filteredEntries[0].MinorBuildId}`,})
                try {
                    interaction.reply({ embeds: [embed] });
                }
                catch {console.log("NoPerms")}

    })
    .catch(error => {
        console.error('There was a problem fetching the data:', error);
    });

  }
  else if (interaction.commandName === 'watcherclear') {
    let serverChannels = readServerChannels();
      const channelId = interaction.channelId;
      for (let i = serverChannels.length - 1; i >= 0; i--) {
        if (serverChannels[i].channelId === channelId) {
            serverChannels.splice(i, 1); // Remove the item at index i
        }
    }
      console.log(serverChannels)
      console.log(`Channel not found: ${channelId} Removing from Array.`);
      writeServerChannels(serverChannels);

      try {
        await interaction.reply({ content: 'Cleared All Listeners', ephemeral: true });
    }
    catch {console.log("NoPerms")}
  } else if (interaction.commandName === 'checklist') {
    await interaction.deferReply({ ephemeral: true });
    const items = interaction.options.getString('items');
    const itemList = items.split(',');
    try {
    for (const item of itemList) {
        const message = await interaction.channel.send(`🔳 ${item}`);
        await message.react('✅');  // Add a white checkmark reaction
    }

    await interaction.editReply({ content: 'Checklist created!', ephemeral: true });
}
    catch {
        console.log("NoPerms")
    }
} else if (interaction.commandName === 'clearlist') {
    await interaction.deferReply({ ephemeral: true });
    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    const botMessages = fetched.filter(msg => msg.author.bot);

    for (const msg of botMessages.values()) {
        await msg.delete();
    }
    try {
        await interaction.editReply({ content: 'All bot messages cleared!', ephemeral: true });
    }
        catch {
            console.log("NoPerms")
        }
    
} else if (interaction.commandName === 'purgechannel') {
    await interaction.deferReply({ ephemeral: true });
    const channelId = interaction.options.getString('channelid')
    const channel = client.channels.cache.get(channelId)
    const fetched = await channel.messages.fetch({ limit: 100 });
    const botMessages = fetched.filter(msg => msg.author.bot);

    for (const msg of botMessages.values()) {
        await msg.delete();
    }
    try {
        await interaction.editReply({ content: 'All bot messages cleared!', ephemeral: true });
    }
        catch {
            console.log("NoPerms")
        }
    
}
});

//Callback
function embedCallback(data,ServerName) {
    let serverChannels = readServerChannels();
    const partialserverName = interaction.options.getString('name');
    const channelId = interaction.channelId;
    const serverName = nameArray.find(name => name.includes(partialserverName));
    if (!serverName){

        try {
            interaction.reply({ content: 'Cant Finder Server Info', ephemeral: true });
            return console.log("badName")
        }
        catch {console.log("NoPerms")}
      
    } 
    console.log(serverName);
    serverChannels.push({ serverName, channelId });
    writeServerChannels(serverChannels);

    try {
        interaction.reply({ content: `Server ${serverName} added to the list.`, ephemeral: true });
        return console.log("badName")
    }
    catch {console.log("NoPerms")}

    
}


//Reactions
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
console.log("reactionhi")
        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }

        if (user.bot) return; // Ignore reactions from bots

        if (reaction.emoji.name === '✅') {
            const message = reaction.message;
            if (!message.content.startsWith('🔳')) return; // ignore messages that are not checklist items
            await message.edit({ content: `✅ ${message.content.slice(2)} (completed by <@${user.id}>)` }); // mark the item as completed and mention the user
            await message.reactions.removeAll()
        }
    } catch (error) {
        console.error(`An error occurred in messageReactionAdd: ${error}`);
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
