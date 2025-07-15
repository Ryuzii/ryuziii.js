const path = require('path');
const fs = require('fs');

module.exports = async (client, interaction) => {
  if (interaction.type !== 2) return; // Only handle application commands
  const slashPath = path.join(__dirname, '../slash');
  const slashFiles = fs.readdirSync(slashPath).filter(f => f.endsWith('.js'));
  for (const file of slashFiles) {
    const command = require(path.join(slashPath, file));
    const name = command.data?.command?.name || command.data?.name || command.name;
    if (name === interaction.data.name) {
      try {
        return await command.execute(client, interaction);
      } catch (err) {
        console.error('Error executing slash command:', err);
        if (!interaction.replied) {
          await interaction.reply('There was an error executing this command.');
        }
      }
    }
  }
}; 