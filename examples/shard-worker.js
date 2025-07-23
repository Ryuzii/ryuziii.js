// This file is spawned by the ShardManager for each shard
const { Client, Constants } = require('../src/index');

// Parse shard information from command line arguments
const shardId = parseInt(process.argv.find(arg => arg.startsWith('--shard-id='))?.split('=')[1] || process.argv[process.argv.indexOf('--shard-id') + 1]);
const shardCount = parseInt(process.argv.find(arg => arg.startsWith('--shard-count='))?.split('=')[1] || process.argv[process.argv.indexOf('--shard-count') + 1]);

if (isNaN(shardId) || isNaN(shardCount)) {
  console.error('Invalid shard configuration');
  process.exit(1);
}

console.log(`🚀 Starting shard ${shardId} of ${shardCount}`);

// Create client for this shard
const client = new Client({
  intents: Constants.INTENTS.GUILDS | 
           Constants.INTENTS.GUILD_MESSAGES | 
           Constants.INTENTS.MESSAGE_CONTENT |
           Constants.INTENTS.GUILD_VOICE_STATES,
  shard: [shardId, shardCount],
  maxCacheSize: 500,
  maxMemoryUsage: 256 * 1024 * 1024, // 256MB per shard
  memoryMonitoring: true
});

let ready = false;
let lastStatsReport = 0;

// Bot functionality
client.on('ready', () => {
  ready = true;
  console.log(`✅ Shard ${shardId} ready | ${client.user.username} | ${client.guilds.size} guilds`);
  
  // Report ready to shard manager
  process.send({
    op: 'ready'
  });

  // Report shard ready with stats
  process.send({
    op: 'shardReady',
    guildCount: client.guilds.size,
    userCount: client.users.size
  });
});

client.on('messageCreate', async (message) => {
  if (message.author?.bot) return;

  // Simple shard info command
  if (message.content === '!shard') {
    try {
      await client.rest.request('POST', `/channels/${message.channel_id}/messages`, {
        embeds: [{
          title: '📡 Shard Information',
          fields: [
            {
              name: 'Shard ID',
              value: shardId.toString(),
              inline: true
            },
            {
              name: 'Total Shards',
              value: shardCount.toString(),
              inline: true
            },
            {
              name: 'Guilds on Shard',
              value: client.guilds.size.toString(),
              inline: true
            },
            {
              name: 'Users Cached',
              value: client.users.size.toString(),
              inline: true
            },
            {
              name: 'Channels Cached',
              value: client.channels.size.toString(),
              inline: true
            },
            {
              name: 'Ping',
              value: `${client.ping}ms`,
              inline: true
            }
          ],
          color: 0x3498db,
          footer: {
            text: `Powered by ryuziii.js | Shard ${shardId}`
          }
        }]
      });
    } catch (error) {
      console.error(`Shard ${shardId} error sending message:`, error);
    }
  }

  // Global stats command (expensive, use sparingly)
  if (message.content === '!globalstats') {
    try {
      // This would normally be handled by the shard manager
      // For demo purposes, we'll just show this shard's stats
      const memStats = client.memoryManager.getMemoryStats();
      
      await client.rest.request('POST', `/channels/${message.channel_id}/messages`, {
        embeds: [{
          title: '🌐 Global Statistics (This Shard)',
          description: `This is shard ${shardId} of ${shardCount}`,
          fields: [
            {
              name: '🏠 Guilds (This Shard)',
              value: client.guilds.size.toString(),
              inline: true
            },
            {
              name: '👥 Users Cached',
              value: client.users.size.toString(),
              inline: true
            },
            {
              name: '📺 Channels Cached',
              value: client.channels.size.toString(),
              inline: true
            },
            {
              name: '💾 Memory Usage',
              value: `${Math.round(memStats.heapUsed / 1024 / 1024)}MB`,
              inline: true
            },
            {
              name: '🏓 WebSocket Ping',
              value: `${client.ping}ms`,
              inline: true
            },
            {
              name: '⏱️ Uptime',
              value: client.uptime ? `${Math.floor(client.uptime / 60000)}m` : 'N/A',
              inline: true
            }
          ],
          color: 0xe74c3c,
          footer: {
            text: 'Note: This shows only data from the current shard'
          }
        }]
      });
    } catch (error) {
      console.error(`Shard ${shardId} error sending global stats:`, error);
    }
  }
});

// Guild events for tracking
client.on('guildCreate', (guild) => {
  console.log(`Shard ${shardId} joined guild: ${guild.name} (${guild.id})`);
  reportStats();
});

client.on('guildDelete', (guild) => {
  console.log(`Shard ${shardId} left guild: ${guild.name || guild.id}`);
  reportStats();
});

client.on('disconnect', () => {
  ready = false;
  console.log(`⚠️ Shard ${shardId} disconnected`);
  process.send({ op: 'disconnect' });
});

client.on('reconnecting', () => {
  console.log(`🔄 Shard ${shardId} reconnecting...`);
  process.send({ op: 'reconnecting' });
});

client.on('error', (error) => {
  console.error(`❌ Shard ${shardId} error:`, error);
  process.send({ 
    op: 'error', 
    error: error.message 
  });
});

// Memory management
client.memoryManager.on('memoryWarning', (data) => {
  console.warn(`⚠️ Shard ${shardId} high memory usage: ${Math.round(data.heapUsed / 1024 / 1024)}MB`);
});

client.memoryManager.on('cleanupComplete', (data) => {
  console.log(`🧹 Shard ${shardId} memory cleanup: ${data.itemsCleared} items cleared`);
});

// Report stats periodically
function reportStats() {
  const now = Date.now();
  if (now - lastStatsReport < 30000) return; // Rate limit to once per 30 seconds
  
  lastStatsReport = now;
  const memStats = client.memoryManager.getMemoryStats();
  
  process.send({
    op: 'stats',
    ping: client.ping,
    guildCount: client.guilds.size,
    userCount: client.users.size,
    channelCount: client.channels.size,
    memoryUsage: memStats.heapUsed,
    uptime: client.uptime
  });
}

// Set up periodic stats reporting
setInterval(reportStats, 60000); // Every minute

// Handle messages from shard manager
process.on('message', async (message) => {
  if (!message) return;

  try {
    switch (message.op) {
      case 'eval':
        try {
          const result = eval(message.d.script);
          process.send({
            op: 'evalResult',
            d: {
              nonce: message.d.nonce,
              result: result
            }
          });
        } catch (error) {
          process.send({
            op: 'evalResult',
            d: {
              nonce: message.d.nonce,
              error: error.message
            }
          });
        }
        break;

      case 'shutdown':
        console.log(`🛑 Shard ${shardId} received shutdown signal`);
        client.destroy();
        process.exit(0);
        break;

      default:
        console.log(`Shard ${shardId} received unknown message:`, message);
        break;
    }
  } catch (error) {
    console.error(`Shard ${shardId} error handling message:`, error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`🛑 Shard ${shardId} received SIGTERM`);
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`🛑 Shard ${shardId} received SIGINT`);
  client.destroy();
  process.exit(0);
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error(`❌ Shard ${shardId}: No Discord token provided`);
  process.exit(1);
}

console.log(`🔄 Shard ${shardId} logging in...`);
client.login(token).catch(error => {
  console.error(`❌ Shard ${shardId} failed to login:`, error);
  process.exit(1);
});
