module.exports = {
  name: 'ping',
  async execute(client, msg, args) {
    await msg.reply('Pong!');
  }
}; 