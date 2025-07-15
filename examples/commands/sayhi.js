module.exports = {
  name: 'sayhi',
  async execute(client, msg, args) {
    await msg.channel.send('Hello, channel!');
  }
}; 