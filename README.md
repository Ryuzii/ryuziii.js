<div align="center">
  <img src="assets/logo.png" alt="ryuziii.js logo" width="400">
</div>

---

  <p>
    <a href="https://www.npmjs.com/package/ryuziii.js"><img src="https://img.shields.io/npm/v/ryuziii.js?style=flat-square" alt="npm version"></a>
    <a href="https://github.com/ryuzii/ryuziii.js"><img src="https://img.shields.io/github/stars/ryuzii/ryuziii.js?style=flat-square" alt="GitHub stars"></a>
    <a href="https://github.com/ryuzii/ryuziii.js/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ryuzii/ryuziii.js?style=flat-square" alt="MIT License"></a>
    <a href="https://discord.com/developers/docs/intro"><img src="https://img.shields.io/badge/discord-api-7289da?style=flat-square&logo=discord" alt="Discord API"></a>
    <a href="https://www.npmjs.com/package/ryuziii.js"><img src="https://img.shields.io/npm/dm/ryuziii.js?style=flat-square" alt="npm downloads"></a>
    <a href="https://github.com/ryuzii/ryuziii.js/commits/main"><img src="https://img.shields.io/github/last-commit/ryuzii/ryuziii.js?style=flat-square" alt="last commit"></a>
  </p>

  <p align="center">
    <a href="#documentation"><b>Documentation ✨</b></a> •
    <a href="https://github.com/ryuzii/ryuziii.js"><b>Source code 🖋️</b></a> •
    <a href="#usage"><b>Examples 🛠️</b></a> •
    <a href="https://discord.gg/k3EJ5Et9"><b>Community 💬</b></a>
  </p>
</div>

A high-performance, **developer-friendly** Discord API wrapper for JavaScript with built-in builders, convenient methods, and advanced features. No more `client.rest.request()` - just clean, simple code that actually makes sense! Perfect for music bots and large-scale applications.

---

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Slash Commands](#slash-command-example)
  - [Advanced Usage](#advanced-usage)
- [Contributors](#contributors)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- 🎯 **Developer Friendly:** `client.sendMessage()` instead of `client.rest.request()` - finally!
- 🏗️ **Built-in Builders:** EmbedBuilder, SlashCommandBuilder, MessageBuilder included
- ⚡ **Fast & Lightweight:** Minimal memory and CPU usage, perfect for heavy-load and large bots
- 🎵 **Music Bot Ready:** Full voice connection support with Opus streaming
- 📡 **Auto Sharding:** Built-in sharding for bots in 1000+ servers  
- 🎨 **Rich Features:** Color names (`'success'`, `'error'`), preset embeds, easy interactions
- 💾 **Smart Caching:** LRU cache with automatic memory management and cleanup
- 🔧 **TypeScript Ready:** Full TypeScript definitions included

---

## Installation
```sh
npm install ryuziii.js
```

---

## Quick Start

### The Old Way vs ryuziii.js Way ✨

**Other libraries** 😭:
```js
// The hard way
await client.rest.request('POST', `/channels/${id}/messages`, {
  embeds: [{ title: 'Hello', color: 0x00ff00, timestamp: new Date().toISOString() }]
});
```

**ryuziii.js** 😍:
```js
// Clean, simple, beautiful!
const embed = new EmbedBuilder()
  .setTitle('Hello')
  .setColor('success')
  .setTimestamp();

await client.sendMessage(id, { embeds: [embed] });
```

### Basic Bot

```js
const { Client, Constants, EmbedBuilder } = require('ryuziii.js');

const client = new Client({
  intents: Constants.INTENTS.GUILDS | Constants.INTENTS.GUILD_MESSAGES | Constants.INTENTS.MESSAGE_CONTENT
});

client.on('ready', () => {
  console.log('Bot is ready!');
  client.setPlaying('with ryuziii.js'); // Easy status!
});

client.on('messageCreate', async (message) => {
  if (message.content === '!ping') {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor('success')
      .addField('Latency', `${client.ping}ms`, true);
    
    await client.sendMessage(message.channel_id, { embeds: [embed] });
  }
});

client.login('YOUR_BOT_TOKEN');
```

---

## Usage

### Slash Command Example
```js
const { SlashCommandBuilder, EmbedBuilder } = require('ryuziii.js');

// Register command
const pingCommand = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency');

// Handle interaction
client.interactions.addSlashCommand('ping', async (interaction) => {
  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .addField('Latency', `${client.ping}ms`, true)
    .setColor('success');
  
  await interaction.reply({ embeds: [embed] });
});
```

### Advanced Usage

#### Event Folder Loader
```js
// Load all events from a folder
require('fs').readdirSync('./events').forEach(file => {
  const event = require(`./events/${file}`);
  client.on(file.replace('.js', ''), (...args) => event(client, ...args));
});
```

#### Command Folder Loader
```js
// Load all commands from a folder
const commands = new Map();
require('fs').readdirSync('./commands').forEach(file => {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command);
});
```

#### Register Slash Commands (Global or Per-Guild)
```js
const commands = ryuziii.loadSlashCommands('./slash');
// Global
await client.slash.setGlobal(commands);
// Per-guild
await client.slash.set(commands, 'YOUR_GUILD_ID');
```

#### Built-in Client Methods
```js
// Easy messaging
await client.sendMessage(channelId, 'Hello!');
await client.editMessage(channelId, messageId, 'Updated!');
await client.deleteMessage(channelId, messageId);

// Status management  
client.setPlaying('music');
client.setListening('commands');
client.setWatching('for errors');

// Moderation
await client.kickMember(guildId, userId, 'Breaking rules');
await client.banMember(guildId, userId, { reason: 'Spam' });
```

#### Sharding Example
```js
const { ShardManager } = require('ryuziii.js');
const manager = new ShardManager('./bot.js', { 
  totalShards: 'auto',
  token: 'YOUR_BOT_TOKEN'
});
manager.spawn();
```

#### Voice/Music Example
```js
const { VoiceConnection } = require('ryuziii.js');

// Join voice channel
await client.joinVoiceChannel(guildId, channelId);

// Create voice connection
const voiceConnection = new VoiceConnection(client, guildId, channelId);
voiceConnection.playOpusStream(audioStream);
```

---

## Example Bot

A full-featured example bot is included in the [`examples/`](./examples) folder!

### EmbedBuilder Example

```js
const { EmbedBuilder } = require('ryuziii.js');

// Beautiful embeds with color names!
const embed = new EmbedBuilder()
  .setTitle('✨ Success!')
  .setDescription('This is so much easier!')
  .addField('Before', 'Hard to use APIs', true)
  .addField('Now', 'Clean and simple!', true)
  .setColor('success') // or 'error', 'warning', 'info', 'discord'
  .setThumbnail('https://example.com/image.png')
  .setFooter('Made with ryuziii.js')
  .setTimestamp();

await client.sendMessage(channelId, { embeds: [embed] });
```

### Advanced Examples

See our example files for complete implementations:
- [`examples/basic.js`](./examples/basic.js) - Simple bot with modern features
- [`examples/advanced-bot.js`](./examples/advanced-bot.js) - Full-featured bot
- [`examples/music-bot.js`](./examples/music-bot.js) - Voice connections & music
- [`examples/sharding.js`](./examples/sharding.js) - Sharding for large bots

---

> **Tip:**  
> Explore the [`examples/`](./examples) directory for more usage patterns and advanced features!

---

## Contributors

| [<img src="https://github.com/ryuzii.png" width="64" height="64" alt="Ryuzii"/><br>**Ryuzii**](https://github.com/ryuzii) | [<img src="https://github.com/octocat.png" width="64" height="64" alt="Other Contributor"/><br>**Other Contributor**](https://github.com/octocat) |
|:---:|:---:|

Want to help? [Open an issue or PR!](https://github.com/ryuzii/ryuziii.js/issues)

---

## Contributing
We welcome contributions! Please:
- Fork the repo
- Open a pull request
- Follow the code style and add tests/examples if possible
- Add yourself to the contributors list in package.json and README

---

## License
<details>
  <summary><strong>MIT License &darr; (click to expand)</strong></summary>

```
MIT License

Copyright (c) 2025 Ryuzii

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
</details>

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/ryuzii">Ryuzii</a> and contributors.</sub>
</div> 
