// Example: Basic bot using ryuziii.js (OOP-style)
const ryuziii = require('../src');

// Replace with your bot token
const TOKEN = process.env.BOT_TOKEN || 'TOKEN';

const client = new ryuziii.Client({
  token: TOKEN,
  intents: [
    'GUILDS', 
    'GUILD_MESSAGES', 
    'MESSAGE_CONTENT'
  ]
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('messageCreate', async (msg) => {
  console.log(`[${msg.author.username}]: ${msg.content}`);
  if (msg.content === '!ping') {
    // Reply to the user (mentions and replies)
    await msg.reply('Pong!');
  }
  if (msg.content === '!sayhi') {
    // Send a message to the channel (no mention, not a reply)
    await msg.channel.send('Hello, channel!');
  }
});

client.login();

// To run: BOT_TOKEN=your_token node examples/basic-bot.js 