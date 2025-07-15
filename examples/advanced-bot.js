const ryuziii = require('../src');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN || 'TOKEN';

const client = new ryuziii.Client({
  token: TOKEN,
  intents: [
    'GUILDS',
    'GUILD_MESSAGES',
    'MESSAGE_CONTENT',
    'GUILD_MEMBERS'
  ]
});

// Load events
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).forEach(file => {
  const eventName = file.replace('.js', '');
  const handler = require(path.join(eventsPath, file));
  client.on(eventName, (...args) => handler(client, ...args));
});

// Register slash commands on ready
client.on('ready', async () => {
  console.log('Registering slash commands...');
  const commands = ryuziii.loadSlashCommands(path.join(__dirname, 'slash'));
  try {
    await client.slash.setGlobal(commands);
    console.log('Slash commands registered globally!');
  } catch (err) {
    console.error('Failed to register slash commands:', err);
  }
});

// Remove the inline interactionCreate handler; now handled in events/interactionCreate.js

client.login(); 