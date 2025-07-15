const { SlashCommandBuilder } = require('../../src');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(client, interaction) {
    await interaction.reply('Pong!');
  }
}; 