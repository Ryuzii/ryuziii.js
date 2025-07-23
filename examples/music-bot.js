const { Client, VoiceConnection, Constants, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('../src/index');
const fs = require('fs');
const path = require('path');

// Create client optimized for music bots
const client = new Client({
  intents: Constants.INTENTS.GUILDS | 
           Constants.INTENTS.GUILD_VOICE_STATES | 
           Constants.INTENTS.GUILD_MESSAGES |
           Constants.INTENTS.MESSAGE_CONTENT,
  maxCacheSize: 500,
  maxMemoryUsage: 1024 * 1024 * 1024, // 1GB for music bots
  memoryMonitoring: true
});

// Voice connections storage
const voiceConnections = new Map();

client.on('ready', () => {
  console.log(`🎵 ${client.user.username} music bot is ready!`);
  console.log(`🏠 Connected to ${client.guilds.size} guilds`);
});

client.on('messageCreate', async (message) => {
  if (message.isBot) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'join':
      await handleJoinCommand(message);
      break;
    
    case 'leave':
      await handleLeaveCommand(message);
      break;
    
    case 'play':
      await handlePlayCommand(message, args);
      break;
    
    case 'stop':
      await handleStopCommand(message);
      break;
    
    case 'help':
      await handleHelpCommand(message);
      break;
  }
});

async function handleJoinCommand(message) {
  try {
    // Get user's voice state
    const voiceState = client.voiceStates.get(`${message.guild_id}_${message.author.id}`);
    
    if (!voiceState?.channel_id) {
      await message.reply('❌ You need to be in a voice channel first!');
      return;
    }

    // Check if already connected
    if (voiceConnections.has(message.guild_id)) {
      await message.reply('✅ Already connected to a voice channel!');
      return;
    }

    // Create voice connection
    const voiceConnection = new VoiceConnection(client, message.guild_id, voiceState.channel_id);
    voiceConnections.set(message.guild_id, voiceConnection);

    // Set up voice connection events
    voiceConnection.on('ready', async () => {
      console.log(`🔊 Connected to voice channel in guild ${message.guild_id}`);
      await sendMessage(message.channel_id, {
        embeds: [{
          title: '🔊 Voice Connected',
          description: 'Successfully joined the voice channel!',
          color: 0x00ff00
        }]
      });
    });

    voiceConnection.on('disconnect', async () => {
      console.log(`🔇 Disconnected from voice channel in guild ${message.guild_id}`);
      voiceConnections.delete(message.guild_id);
      await sendMessage(message.channel_id, {
        embeds: [{
          title: '🔇 Voice Disconnected',
          description: 'Left the voice channel',
          color: 0xff0000
        }]
      });
    });

    voiceConnection.on('error', async (error) => {
      console.error('Voice connection error:', error);
      voiceConnections.delete(message.guild_id);
      await sendMessage(message.channel_id, {
        content: `❌ Voice connection error: ${error.message}`
      });
    });

    // Listen for voice server update
    const voiceServerListener = (data) => {
      if (data.guild_id === message.guild_id) {
        voiceConnection.connect(data, voiceState.session_id);
        client.off('voiceServerUpdate', voiceServerListener);
      }
    };
    client.on('voiceServerUpdate', voiceServerListener);

    // Join voice channel
    client.ws.send({
      op: Constants.OPCODES.VOICE_STATE_UPDATE,
      d: {
        guild_id: message.guild_id,
        channel_id: voiceState.channel_id,
        self_mute: false,
        self_deaf: false
      }
    });

    await sendMessage(message.channel_id, {
      content: '🔄 Connecting to voice channel...'
    });

  } catch (error) {
    console.error('Join command error:', error);
    await sendMessage(message.channel_id, {
      content: `❌ Failed to join voice channel: ${error.message}`
    });
  }
}

async function handleLeaveCommand(message) {
  try {
    const voiceConnection = voiceConnections.get(message.guild_id);
    
    if (!voiceConnection) {
      await sendMessage(message.channel_id, {
        content: '❌ Not connected to any voice channel!'
      });
      return;
    }

    // Leave voice channel
    client.ws.send({
      op: Constants.OPCODES.VOICE_STATE_UPDATE,
      d: {
        guild_id: message.guild_id,
        channel_id: null,
        self_mute: false,
        self_deaf: false
      }
    });

    voiceConnection.disconnect();
    voiceConnections.delete(message.guild_id);

    await sendMessage(message.channel_id, {
      embeds: [{
        title: '👋 Goodbye!',
        description: 'Successfully left the voice channel',
        color: 0xff9500
      }]
    });

  } catch (error) {
    console.error('Leave command error:', error);
    await sendMessage(message.channel_id, {
      content: `❌ Failed to leave voice channel: ${error.message}`
    });
  }
}

async function handlePlayCommand(message, args) {
  try {
    const voiceConnection = voiceConnections.get(message.guild_id);
    
    if (!voiceConnection || !voiceConnection.ready) {
      await sendMessage(message.channel_id, {
        content: '❌ Not connected to voice channel! Use `!join` first.'
      });
      return;
    }

    if (!args.length) {
      await sendMessage(message.channel_id, {
        content: '❌ Please provide an audio file name or URL!'
      });
      return;
    }

    const audioFile = args[0];
    const audioPath = path.join(__dirname, 'audio', audioFile);

    // Check if local file exists
    if (fs.existsSync(audioPath)) {
      const stream = fs.createReadStream(audioPath);
      
      stream.on('error', async (error) => {
        console.error('Audio stream error:', error);
        await sendMessage(message.channel_id, {
          content: `❌ Error playing audio: ${error.message}`
        });
      });

      stream.on('end', async () => {
        console.log('Audio playback finished');
        voiceConnection.setSpeaking(false);
      });

      voiceConnection.playOpusStream(stream);
      
      await sendMessage(message.channel_id, {
        embeds: [{
          title: '🎵 Now Playing',
          description: `Playing: \`${audioFile}\``,
          color: 0x00ff00,
          footer: {
            text: 'Use !stop to stop playback'
          }
        }]
      });

    } else {
      await sendMessage(message.channel_id, {
        content: `❌ Audio file not found: \`${audioFile}\`\nPlace Opus files in the \`audio/\` directory.`
      });
    }

  } catch (error) {
    console.error('Play command error:', error);
    await sendMessage(message.channel_id, {
      content: `❌ Failed to play audio: ${error.message}`
    });
  }
}

async function handleStopCommand(message) {
  try {
    const voiceConnection = voiceConnections.get(message.guild_id);
    
    if (!voiceConnection) {
      await sendMessage(message.channel_id, {
        content: '❌ Not connected to any voice channel!'
      });
      return;
    }

    voiceConnection.setSpeaking(false);
    
    await sendMessage(message.channel_id, {
      embeds: [{
        title: '⏹️ Stopped',
        description: 'Audio playback stopped',
        color: 0xff0000
      }]
    });

  } catch (error) {
    console.error('Stop command error:', error);
    await sendMessage(message.channel_id, {
      content: `❌ Failed to stop audio: ${error.message}`
    });
  }
}

async function handleHelpCommand(message) {
  try {
    await sendMessage(message.channel_id, {
      embeds: [{
        title: '🎵 Music Bot Commands',
        description: 'High-performance music bot powered by ryuziii.js',
        fields: [
          {
            name: '!join',
            value: 'Join your current voice channel',
            inline: false
          },
          {
            name: '!leave',
            value: 'Leave the current voice channel',
            inline: false
          },
          {
            name: '!play <file>',
            value: 'Play an Opus audio file from the audio/ directory',
            inline: false
          },
          {
            name: '!stop',
            value: 'Stop current audio playback',
            inline: false
          },
          {
            name: '!help',
            value: 'Show this help message',
            inline: false
          }
        ],
        color: 0x9b59b6,
        footer: {
          text: 'Note: Audio files must be in Opus format'
        }
      }]
    });
  } catch (error) {
    console.error('Help command error:', error);
  }
}

async function sendMessage(channelId, data) {
  try {
    await client.rest.request('POST', `/channels/${channelId}/messages`, data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Voice state updates
client.on('voiceStateUpdate', (data) => {
  console.log('Voice state update:', data);
});

client.on('voiceServerUpdate', (data) => {
  console.log('Voice server update for guild:', data.guild_id);
});

// Error handling
client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

// Memory monitoring
client.memoryManager.on('memoryWarning', (data) => {
  console.warn('⚠️ High memory usage:', `${Math.round(data.heapUsed / 1024 / 1024)}MB`);
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ No Discord token provided. Set DISCORD_TOKEN environment variable.');
  process.exit(1);
}

console.log('🔄 Starting music bot...');

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
  console.log('📁 Created audio directory at', audioDir);
  console.log('📝 Place your Opus audio files in this directory');
}

client.login(token).catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down music bot...');
  
  // Disconnect all voice connections
  for (const [guildId, voiceConnection] of voiceConnections) {
    voiceConnection.disconnect();
  }
  
  client.destroy();
  process.exit(0);
});
