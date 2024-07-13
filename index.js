require('dotenv').config();
const { time } = require('console');
const { Client, GatewayIntentBits, EmbedBuilder, Events, Partials, User, Embed } = require('discord.js');
const { GameDig } = require('gamedig');
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
const { Server } = require('http');
let ServerData = []
let NameArray = []
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

function readStackedChannels() {
    try {
        const data = fs.readFileSync('stacked.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading server channels file:', err);
        return [];
    }
}

// Function to write server channels data to JSON file
function writeStackedChannels(serverChannels) {
    try {
        fs.writeFileSync('stacked.json', JSON.stringify(serverChannels, null, 2));
        console.log('Server channels data saved successfully.');
    } catch (err) {
        console.error('Error writing server channels file:', err);
    }
}


// Function to read server channels data from JSON file
function readCharacters() {
    try {
        const data = fs.readFileSync('characters.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading Characters file:', err);
        return [];
    }
}

// Function to write server channels data to JSON file
function writeCharacters(characters) {
    try {
        fs.writeFileSync('characters.json', JSON.stringify(characters, null, 2));
        console.log('Characters Saved');
    } catch (err) {
        console.error('Error writing Characters file:', err);
    }
}

// Function to add a character-server pair
function addCharacter(userId, charId, serverName) {
    let userData = readCharacters();
    let user = userData.find(user => user.userId === userId);
    if (user) {
        user.characters.push({ id: charId, server: serverName });
    } else {
        userData.push({ userId: userId, characters: [{ id: charId, server: serverName }] });
    }
    writeCharacters(userData)
    console.log(userData)
}


// Function to remove a character-server pair
function removeCharacter(userId, charId, server) {
    let userData = readCharacters();
    let userIndex = userData.findIndex(user => user.userId === userId);
    if (userIndex !== -1) {
        let user = userData[userIndex];
        if (server) {
            // Remove character by ID and server
            let characterIndex = user.characters.findIndex(char => char.id === charId && char.server === server);
            if (characterIndex !== -1) {
                user.characters.splice(characterIndex, 1);
            }
        } else {
            // Remove character by ID only
            let characterIndex = user.characters.findIndex(char => char.id === charId);
            if (characterIndex !== -1) {
                user.characters.splice(characterIndex, 1);
            }
        }
        writeCharacters(userData);
    }
}

// Function to get characters for a given user ID
function getCharactersByUserId(userId) {
    let userData = readCharacters();
    let user = userData.find(user => user.userId === userId);
    if (user) {
        return user.characters;
    } else {
        return []; // Return an empty array if user is not found
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
    const jsonData = data;

    const strippedData = jsonData.map(item => ({
        Name: item.Name,
        ip: item.IP,
        Port: item.Port
    }));
    ServerData = strippedData
    // console.log(ServerData);
}

async function quicksearch(add, po) {
    let response;

    try {
        response = await GameDig.query({
            type: 'asa',
            address: add,
            port: po,
            socketTimeout: 4000,
            givenPortOnly: true,
        });
    } catch (error) {
        console.log("Error in quicksearch:", error.message);
        // You can handle the error here, such as logging or returning a default response
        return null; // Return null or any default response in case of error
    }

    return response;
}

async function sendEmbedsToChannels() {
    let serverChannels = readServerChannels();
    for (const entry of serverChannels) {
        const filteredData = entry.serverName;
        const channelId = entry.channelId;

        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            const idx = serverChannels.findIndex(element => element.channelId === channelId)
            serverChannels.splice(idx, 1)
            console.log(serverChannels)
            console.log(`Channel not found: ${channelId} Removing from Array.`);
            writeServerChannels(serverChannels);

            continue;
        }
        if (!filteredData.length) {
            const idx = serverChannels.findIndex(element => element.channelId === channelId)
            serverChannels.splice(idx, 1)
            console.log(serverChannels)
            console.log(`BadArray: ${channelId} Removing from Array.`);
            writeServerChannels(serverChannels);

            continue;
        }

        const embed = new EmbedBuilder()
        const result = await quicksearch(filteredData[0].ip, filteredData[0].Port);
        if (!result) {
            console.log("Quicksearch failed " + filteredData[0].Name)
            embed.setTitle(`${filteredData[0].Name}`)
            .addFields(
                { name: "Players:", value: "```" + `Offline` + "```", inline: true }
            )
        }
        else {
            embed.setTitle(`${result.name}`)
            .addFields(
                { name: "Players:", value: "```" + `${result.numplayers}/${result.maxplayers}` + "```", inline: true },
                { name: "Map:", value: "```" + `${result.map}` + "```", inline: true },
                { name: "IP:", value: "```" + `${result.connect}` + "```", inline: false }
            )
            .setTimestamp()
            .setAuthor({ name: 'Sheogorath', iconURL: 'https://imgur.com/RlyINGK.png' })
            .setFooter({ text: `v${result.version}` });
        }


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

async function SendStackedEmbeds() {
    let serverChannels = readStackedChannels();
    for (const entry of serverChannels) {
        const filteredData = entry.servers;
        const channelId = entry.channelId;

        const channel = client.channels.cache.get(channelId);
        if (!channel || !filteredData.length) {
            const idx = serverChannels.findIndex(element => element.channelId === channelId);
            serverChannels.splice(idx, 1);
            console.log(serverChannels);
            console.log(`Channel not found or bad array: ${channelId}. Removing from Array.`);
            writeStackedChannels(serverChannels);
            continue;
        }

        const embed = new EmbedBuilder()

        const promises = filteredData.map(async (element, index) => {
            try {
                const result = await quicksearch(element.ip, element.Port);
                return { index, result };
            } catch (error) {
                console.log("Error in quicksearch:", error.message);
                return { index, error };
            }
        });

        const results = await Promise.allSettled(promises);
        // console.log(results)
        results.forEach(({ value, error}) => {
            if (error) {
                console.log("Error in quicksearch:", error.message);
                return;
            }
            if (!value.result)
            {
                embed.addFields(
                    { name: `${filteredData[value.index].name}`, value: "```" + `Dead` + "```", inline: true });
                    return
            };
            // trimmedname = result.name.replace(/\D/g, "");
            embed.addFields(
                { name: `${filteredData[value.index].name}`, value: "```" + `${value.result.numplayers}/${value.result.maxplayers}` + "```", inline: true }
            );
        });

        embed.setTimestamp();

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
            console.error(`Error updating/embedding message in channel ${channelId}: ${error.message}`);
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
        const serverName = ServerData.filter(item => item.Name.includes(partialserverName));
        if (!serverName) {
            try {
                await interaction.reply({ content: 'Cant Finder Server Info', ephemeral: true });
                return console.log("badName")
            }
            catch { return console.log("NoPerms") }

        }
        serverChannels.push({ serverName, channelId });
        writeServerChannels(serverChannels);
        try {
            await interaction.reply({ content: `Server ${serverName[0].Name} added to the list.`, ephemeral: true });
        }
        catch { return console.log("NoPerms") }
    }
    else if (interaction.commandName === 'server') {
        const partialserverName = interaction.options.getString('name');
        const intuser = interaction.user.displayName
        const filteredData = ServerData.filter(item => item.Name.includes(partialserverName));
        console.log(filteredData.length)
        if (!filteredData.length) {
            try {
                await interaction.reply({ content: 'Cant Finder Server Info', ephemeral: true });
                return console.log("badName")
            }
            catch { return console.log("NoPerms1") }
        }
        const result = await quicksearch(filteredData[0].ip, filteredData[0].Port)
        // console.log(result)

        const timenow = Math.floor(Date.now() / 1000)
        if (!result) {
            try {
                await interaction.reply({ content: 'Cant Finder Server Info', ephemeral: true });
                return console.log("badName")
            }
            catch { return console.log("NoPerms2") }
        }
        const embed = new EmbedBuilder()
            .setTitle(`${result.name}`);
        embed.addFields({ name: "Players:", value: "```" + `${result.numplayers}/${result.maxplayers}` + "```", inline: true }, { name: "Map:", value: "```" + `${result.map}` + "```", inline: true }, { name: "IP:", value: "```" + `${result.connect}` + "```", inline: false });
        embed.setTimestamp()
        embed.setAuthor({ name: 'Sheogorath', iconURL: 'https://imgur.com/RlyINGK.png' })
        embed.setFooter({ text: `v${result.version}`, })
        try {
            interaction.reply({ embeds: [embed] });
            const channel = client.channels.cache.get('1218086724257714247');
            channel.send('***Server Ping at ' + `<t:${timenow}:R> \n` + `${intuser} - ${result.name}***`);
        }
        catch { console.log("NoPerms3") }

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
        catch { console.log("NoPerms") }
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
    } else if (interaction.commandName === 'invite') {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const character = interaction.options.getString('character');
        const server = interaction.options.getString('server');
        addCharacter(user.id, character, server);
        let characters = getCharactersByUserId(user.id);
        console.log(characters); // Output: [{ id: "CHAR1", server: "SERVER1" }, { id: "CHAR2", server: "SERVER2" }, { id: "CHAR3", server: "SERVER3" }]
        try {

            await interaction.editReply({ content: "Character Added", ephemeral: true });
        }
        catch {
            console.log("NoPerms")
        }
    }
    else if (interaction.commandName === 'remove') {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const character = interaction.options.getString('character');
        const server = interaction.options.getString('server');
        removeCharacter(user.id, character, server)
        let characters = getCharactersByUserId(user.id);
        console.log(characters); // Output: [{ id: "CHAR1", server: "SERVER1" }, { id: "CHAR2", server: "SERVER2" }, { id: "CHAR3", server: "SERVER3" }]
        try {

            await interaction.editReply({ content: "Character Removed", ephemeral: true });
        }
        catch {
            console.log("NoPerms")
        }
    }

    else if (interaction.commandName === 'characters') {
        // Retrieve characters for a given user ID (replace this with your own logic)
        const user = interaction.options.getUser('user');
        if (user.bot) {
            interaction.reply("User is Bot");
            return
        }
        let characters = getCharactersByUserId(user.id);
        console.log(characters)
        let charactersByServer = {};
        characters.forEach(character => {
            if (!charactersByServer[character.server]) {
                charactersByServer[character.server] = [];
            }
            charactersByServer[character.server].push(character.id);
            console.log(charactersByServer)
        });
        const embed = new EmbedBuilder()
            .setTitle(user.globalName)
            .setColor('#0099ff');

        // Add fields for each character
        for (const [server, charIds] of Object.entries(charactersByServer)) {

            const charactersList = charIds.join('\n');
            embed.addFields({ name: server, value: charactersList, inline: true });
        }

        // Reply with the embed
        try {
            interaction.reply({ embeds: [embed] });
        }
        catch { console.log("NoPerms") }
    }
    else if (interaction.commandName === 'purgechannel') {
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

//Reactions
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
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

    setInterval(fetchData, 600000); // Fetch data every 5 seconds
    sendEmbedsToChannels();
    setInterval(sendEmbedsToChannels, 10000);
    setInterval(SendStackedEmbeds, 10000);
    
});

// Log in to Discord with your bot token
client.login(process.env.TOKEN);
