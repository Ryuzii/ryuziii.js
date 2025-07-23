const { Client, Constants, EmbedBuilder, SlashCommandBuilder } = require('../src/index');

// Create client with basic intents
const client = new Client({
  intents: Constants.INTENTS.GUILDS | 
           Constants.INTENTS.GUILD_MESSAGES | 
           Constants.INTENTS.MESSAGE_CONTENT,
  maxCacheSize: 100, // Small cache for testing
  memoryMonitoring: true
});

client.on('ready', async () => {
  console.log(`🚀 ${client.user.username} is ready!`);
  console.log(`📊 Ping: ${client.ping}ms`);
  console.log(`🏠 Guilds: ${client.guilds.size}`);
  
  // Set bot status
  client.setPlaying('with ryuziii.js');
  
  // Create slash commands (example)
  try {
    const pingCommand = new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot latency');
    
    const statsCommand = new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Show bot statistics');
    
    // Register commands globally (remove guildId for global commands)
    // await client.createSlashCommand(null, pingCommand);
    // await client.createSlashCommand(null, statsCommand);
    
    console.log('✅ Slash commands ready (uncomment to register)');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author?.bot) return;

  // Simple ping command
  if (message.content === '!ping') {
    const startTime = Date.now();
    
    try {
      await client.sendMessage(message.channel_id, '🏓 Calculating ping...');
      
      const endTime = Date.now();
      const apiLatency = endTime - startTime;
      
      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .addField('API Latency', `${apiLatency}ms`, true)
        .addField('WebSocket Latency', `${client.ping}ms`, true)
        .setColor('success')
        .setTimestamp();
      
      await client.sendMessage(message.channel_id, { embeds: [embed] });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Stats command
  if (message.content === '!stats') {
    const memStats = client.memoryManager.getMemoryStats();
    const uptime = client.uptime;
    
    const uptimeString = uptime ? 
      `${Math.floor(uptime / 86400000)}d ${Math.floor((uptime % 86400000) / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m` :
      'Not available';

    try {
      const embed = new EmbedBuilder()
        .setTitle('📊 Bot Statistics')
        .addField('⏱️ Uptime', uptimeString, true)
        .addField('🏠 Guilds', client.guilds.size.toString(), true)
        .addField('👥 Users', client.users.size.toString(), true)
        .addField('💾 Memory Usage', `${Math.round(memStats.heapUsed / 1024 / 1024)}MB / ${Math.round(memStats.maxMemory / 1024 / 1024)}MB`, true)
        .addField('📨 Cached Messages', client.messageCache.size.toString(), true)
        .addField('🔗 WebSocket Ping', `${client.ping}ms`, true)
        .setColor('info')
        .setTimestamp();
      
      await client.sendMessage(message.channel_id, { embeds: [embed] });
    } catch (error) {
      console.error('Error sending stats:', error);
    }
  }

  // Help command
  if (message.content === '!help') {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🤖 ryuziii.js Demo Bot')
        .setDescription('A high-performance Discord API library demonstration')
        .addField('!ping', 'Check bot latency')
        .addField('!stats', 'Show bot statistics')
        .addField('!help', 'Show this help message')
        .setColor('purple')
        .setFooter('Powered by ryuziii.js');
      
      await client.sendMessage(message.channel_id, { embeds: [embed] });
    } catch (error) {
      console.error('Error sending help:', error);
    }
  }
});

// Slash command handling
client.interactions.addSlashCommand('ping', async (interaction) => {
  const startTime = Date.now();
  
  await interaction.defer();
  
  const endTime = Date.now();
  const apiLatency = endTime - startTime;
  
  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .addField('API Latency', `${apiLatency}ms`, true)
    .addField('WebSocket Latency', `${client.ping}ms`, true)
    .setColor('success')
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
});

client.interactions.addSlashCommand('stats', async (interaction) => {
  await interaction.defer();
  
  const memStats = client.memoryManager.getMemoryStats();
  const uptime = client.uptime;
  
  const uptimeString = uptime ? 
    `${Math.floor(uptime / 86400000)}d ${Math.floor((uptime % 86400000) / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m` :
    'Not available';
  
  const embed = new EmbedBuilder()
    .setTitle('📊 Bot Statistics')
    .addField('⏱️ Uptime', uptimeString, true)
    .addField('🏠 Guilds', client.guilds.size.toString(), true)
    .addField('👥 Users', client.users.size.toString(), true)
    .addField('💾 Memory Usage', `${Math.round(memStats.heapUsed / 1024 / 1024)}MB / ${Math.round(memStats.maxMemory / 1024 / 1024)}MB`, true)
    .addField('📨 Cached Messages', client.messageCache.size.toString(), true)
    .addField('🔗 WebSocket Ping', `${client.ping}ms`, true)
    .setColor('info')
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
});

// Memory management events
client.memoryManager.on('memoryWarning', (data) => {
  console.warn('⚠️ High memory usage detected:', {
    usage: `${Math.round(data.heapUsed / 1024 / 1024)}MB`,
    ratio: `${Math.round(data.usageRatio * 100)}%`
  });
});

client.memoryManager.on('cleanupComplete', (data) => {
  console.log('🧹 Memory cleanup completed:', `${data.itemsCleared} items cleared`);
});

// Error handling
client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

client.on('debug', (message) => {
  console.log('🐛 Debug:', message);
});

// Login with token from environment variable
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ No Discord token provided. Set DISCORD_TOKEN environment variable.');
  process.exit(1);
}

console.log('🔄 Logging in...');
client.login(token).catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  client.destroy();
  process.exit(0);
});
