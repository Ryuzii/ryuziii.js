const { ShardManager } = require('../src/index');
const path = require('path');

// Configuration
const TOKEN = process.env.DISCORD_TOKEN;
const SHARD_COUNT = process.env.SHARD_COUNT || 'auto';

if (!TOKEN) {
  console.error('❌ No Discord token provided. Set DISCORD_TOKEN environment variable.');
  process.exit(1);
}

// Create shard manager
const manager = new ShardManager(path.join(__dirname, 'shard-worker.js'), {
  totalShards: SHARD_COUNT,
  token: TOKEN,
  spawnDelay: 5000,        // 5 second delay between shard spawns
  spawnTimeout: 30000,     // 30 second timeout for shard spawning
  respawn: true            // Auto-respawn dead shards
});

console.log('🚀 Starting Shard Manager...');

// Shard events
manager.on('shardCreate', (shard) => {
  console.log(`📡 Shard ${shard.id} created`);
});

manager.on('shardReady', (shard) => {
  console.log(`✅ Shard ${shard.id} ready | Guilds: ${shard.guildCount} | Users: ${shard.userCount}`);
});

manager.on('shardDisconnect', (shard) => {
  console.log(`⚠️ Shard ${shard.id} disconnected`);
});

manager.on('shardReconnecting', (shard) => {
  console.log(`🔄 Shard ${shard.id} reconnecting...`);
});

manager.on('shardDestroy', (shard) => {
  console.log(`💥 Shard ${shard.id} destroyed`);
});

manager.on('shardError', (shard, error) => {
  console.error(`❌ Shard ${shard.id} error:`, error);
});

manager.on('shardMessage', (shard, message) => {
  if (message.type === 'stats') {
    console.log(`📊 Shard ${shard.id} stats:`, message.data);
  }
});

// Start spawning shards
async function start() {
  try {
    const shards = await manager.spawn();
    console.log(`🎉 Successfully spawned ${shards.size} shards`);
    
    // Set up periodic stats collection
    setInterval(async () => {
      try {
        const stats = await collectStats();
        displayStats(stats);
      } catch (error) {
        console.error('Error collecting stats:', error);
      }
    }, 30000); // Every 30 seconds

  } catch (error) {
    console.error('❌ Failed to spawn shards:', error);
    process.exit(1);
  }
}

async function collectStats() {
  try {
    const [
      guildCounts,
      userCounts,
      channelCounts,
      pings,
      memoryUsage
    ] = await Promise.all([
      manager.broadcastEval('this.guilds.size'),
      manager.broadcastEval('this.users.size'),
      manager.broadcastEval('this.channels.size'),
      manager.broadcastEval('this.ping'),
      manager.broadcastEval('process.memoryUsage().heapUsed')
    ]);

    return {
      totalGuilds: guildCounts.reduce((a, b) => a + b, 0),
      totalUsers: userCounts.reduce((a, b) => a + b, 0),
      totalChannels: channelCounts.reduce((a, b) => a + b, 0),
      averagePing: pings.filter(p => p > 0).reduce((a, b) => a + b, 0) / pings.filter(p => p > 0).length || 0,
      totalMemory: memoryUsage.reduce((a, b) => a + b, 0),
      shardCount: manager.shards.size,
      shards: manager.shards.map(shard => ({
        id: shard.id,
        guilds: guildCounts[shard.id] || 0,
        users: userCounts[shard.id] || 0,
        channels: channelCounts[shard.id] || 0,
        ping: pings[shard.id] || -1,
        memory: memoryUsage[shard.id] || 0,
        ready: shard.ready
      }))
    };
  } catch (error) {
    console.error('Error in collectStats:', error);
    return null;
  }
}

function displayStats(stats) {
  if (!stats) return;

  console.log('\n📊 === CLUSTER STATISTICS ===');
  console.log(`🏠 Total Guilds: ${stats.totalGuilds.toLocaleString()}`);
  console.log(`👥 Total Users: ${stats.totalUsers.toLocaleString()}`);
  console.log(`📺 Total Channels: ${stats.totalChannels.toLocaleString()}`);
  console.log(`🏓 Average Ping: ${Math.round(stats.averagePing)}ms`);
  console.log(`💾 Total Memory: ${Math.round(stats.totalMemory / 1024 / 1024)}MB`);
  console.log(`📡 Active Shards: ${stats.shardCount}`);
  
  console.log('\n📡 SHARD BREAKDOWN:');
  stats.shards.forEach(shard => {
    const status = shard.ready ? '✅' : '❌';
    const ping = shard.ping > 0 ? `${shard.ping}ms` : 'N/A';
    const memory = `${Math.round(shard.memory / 1024 / 1024)}MB`;
    
    console.log(`  ${status} Shard ${shard.id}: ${shard.guilds} guilds | ${ping} | ${memory}`);
  });
  console.log('================================\n');
}

// Commands for managing shards
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    const command = chunk.trim().split(' ');
    handleCommand(command);
  }
});

async function handleCommand(command) {
  try {
    switch (command[0]) {
      case 'stats':
        const stats = await collectStats();
        displayStats(stats);
        break;
      
      case 'eval':
        if (command.length < 2) {
          console.log('Usage: eval <code>');
          break;
        }
        const code = command.slice(1).join(' ');
        const results = await manager.broadcastEval(code);
        console.log('Eval results:', results);
        break;
      
      case 'respawn':
        if (command.length < 2) {
          console.log('Usage: respawn <shard_id|all>');
          break;
        }
        if (command[1] === 'all') {
          console.log('🔄 Respawning all shards...');
          await manager.respawnAll();
          console.log('✅ All shards respawned');
        } else {
          const shardId = parseInt(command[1]);
          if (isNaN(shardId)) {
            console.log('Invalid shard ID');
            break;
          }
          console.log(`🔄 Respawning shard ${shardId}...`);
          await manager.respawnShard(shardId);
          console.log(`✅ Shard ${shardId} respawned`);
        }
        break;
      
      case 'help':
        console.log('\n📖 Available Commands:');
        console.log('  stats - Show cluster statistics');
        console.log('  eval <code> - Evaluate code on all shards');
        console.log('  respawn <shard_id|all> - Respawn specific shard or all shards');
        console.log('  help - Show this help message');
        console.log('  exit - Shutdown the cluster\n');
        break;
      
      case 'exit':
        console.log('🛑 Shutting down cluster...');
        process.exit(0);
        break;
      
      default:
        if (command[0]) {
          console.log(`Unknown command: ${command[0]}. Type 'help' for available commands.`);
        }
        break;
    }
  } catch (error) {
    console.error('Command error:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  try {
    // Broadcast shutdown message to all shards
    await manager.broadcast({ type: 'shutdown' });
    
    // Wait a bit for shards to clean up
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Force kill any remaining shards
    for (const shard of manager.shards.values()) {
      await shard.kill();
    }
    
    console.log('✅ Cluster shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Display help on startup
console.log('\n📖 Shard Manager Started');
console.log('Type "help" for available commands');
console.log('Type "stats" to see cluster statistics\n');

// Start the cluster
start();
