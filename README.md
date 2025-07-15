<div align="center">
  <img src="https://media.discordapp.net/attachments/1380372519101399062/1394566176679661688/image-removebg-preview.png?ex=68774676&is=6875f4f6&hm=018e7a354bf452ad0dec4b647e890d67e03c8dfc1f4d4fd330e702c2349c9405&=&format=webp&quality=lossless&width=942&height=175" alt="ryuziii.js logo" width="400"/>

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

A high-performance, minimal, and advanced Discord API wrapper for JavaScript, designed for simplicity, low resource usage, and advanced features like sharding, voice, and slash commands. Built for both beginners and advanced bot developers who want full control and modern ergonomics.

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
- ⚡ **Fast & Lightweight:** Minimal memory and CPU usage, perfect for heavy-load and large bots.
- 🧩 **Modular:** Use only what you need—core, sharding, voice, cache, and more.
- 🛠️ **Modern API:** Familiar Client, message, and interaction helpers (like discord.js).
- 🎤 **Voice & Music Ready:** Built-in voice helpers, compatible with music nodes (Lavalink, etc.).
- 🗂️ **Slash Commands:** Builder-style API and easy registration, just like discord.js.
- 🧠 **Custom Caching:** Plug in your own cache or use the built-in one with TTL and size limits.
- 🦾 **Advanced:** Sharding, REST helpers, event folders, command folders, and more.

---

## Installation
```sh
npm install ryuziii.js
```

---

## Quick Start
```js
const ryuziii = require('ryuziii.js');
const client = new ryuziii.Client({
  token: 'YOUR_BOT_TOKEN',
  intents: ['GUILDS', 'GUILD_MESSAGES', 'MESSAGE_CONTENT']
});

client.on('ready', () => console.log('Bot is ready!'));
client.on('messageCreate', msg => {
  if (msg.content === '!ping') msg.reply('Pong!');
});
client.login();
```

---

## Usage

### Slash Command Example
```js
const { SlashCommandBuilder } = require('ryuziii.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
  async execute(client, interaction) {
    await interaction.reply('Pong!');
  }
};
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

#### Sharding Example
```js
const { ShardingManager } = require('ryuziii.js');
const manager = new ShardingManager('YOUR_BOT_TOKEN', { shardCount: 2 });
manager.spawn();
```

#### Voice Example
```js
const { VoiceConnection, AudioPlayer } = require('ryuziii.js');
// See docs/examples for full voice/music bot usage
```

---

## Example Bot

A full-featured example bot is included in the [`examples/`](./examples) folder!

### Basic Example

```js
const ryuziii = require('ryuziii.js');
const client = new ryuziii.Client({
  token: 'YOUR_BOT_TOKEN',
  intents: ['GUILDS', 'GUILD_MESSAGES', 'MESSAGE_CONTENT']
});

client.on('ready', () => console.log('Bot is ready!'));
client.on('messageCreate', msg => {
  if (msg.content === '!ping') msg.reply('Pong!');
});
client.login();
```

### Advanced Example

See [`examples/advanced-bot.js`](./examples/advanced-bot.js) for a modular bot with:
- Event folders
- Command folders
- Slash command support
- Sharding and voice ready

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
