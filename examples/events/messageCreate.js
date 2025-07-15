const path = require('path');
const fs = require('fs');

module.exports = async (client, msg) => {
  if (!msg.content || !msg.content.startsWith('!')) return;
  const args = msg.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name === commandName) {
      return command.execute(client, msg, args);
    }
  }
}; 