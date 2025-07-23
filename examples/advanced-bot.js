const { 
  Client, 
  Constants, 
  EmbedBuilder, 
  MessageBuilder, 
  SlashCommandBuilder 
} = require('../src/index');

// Create an advanced bot with all features
const client = new Client({
  intents: Constants.INTENTS.GUILDS | 
           Constants.INTENTS.GUILD_MESSAGES | 
           Constants.INTENTS.MESSAGE_CONTENT |
           Constants.INTENTS.GUILD_MEMBERS |
           Constants.INTENTS.GUILD_VOICE_STATES,
  maxCacheSize: 500,
  messageCacheSize: 2000,
  memoryMonitoring: true,
  autoCleanup: true
});

client.on('ready', async () => {
  console.log(`🚀 ${client.user.username} is ready and loaded with features!`);
  
  // Set a cool presence
  client.setListening('your commands');
  
  // Register all slash commands
  await registerSlashCommands();
  
  console.log('✅ All features loaded and ready!');
});

async function registerSlashCommands() {
  try {
    // Ping command
    const pingCommand = new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot latency and API response time');

    // User info command with user option
    const userInfoCommand = new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Get information about a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to get info about')
          .setRequired(false)
      );

    // Say command with string options
    const sayCommand = new SlashCommandBuilder()
      .setName('say')
      .setDescription('Make the bot say something')
      .addStringOption(option =>
        option.setName('message')
          .setDescription('What should I say?')
          .setRequired(true)
          .setMaxLength(2000)
      )
      .addBooleanOption(option =>
        option.setName('embed')
          .setDescription('Send as an embed?')
          .setRequired(false)
      );

    // Math command with number options
    const mathCommand = new SlashCommandBuilder()
      .setName('math')
      .setDescription('Perform mathematical operations')
      .addSubcommand(subcommand =>
        subcommand.setName('add')
          .setDescription('Add two numbers')
          .addNumberOption(option =>
            option.setName('first')
              .setDescription('First number')
              .setRequired(true)
          )
          .addNumberOption(option =>
            option.setName('second')
              .setDescription('Second number')
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand.setName('multiply')
          .setDescription('Multiply two numbers')
          .addNumberOption(option =>
            option.setName('first')
              .setDescription('First number')
              .setRequired(true)
          )
          .addNumberOption(option =>
            option.setName('second')
              .setDescription('Second number')
              .setRequired(true)
          )
      );

    // Poll command with choices
    const pollCommand = new SlashCommandBuilder()
      .setName('poll')
      .setDescription('Create a poll')
      .addStringOption(option =>
        option.setName('question')
          .setDescription('The poll question')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('option1')
          .setDescription('First option')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('option2')
          .setDescription('Second option')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('option3')
          .setDescription('Third option (optional)')
          .setRequired(false)
      );

    // Register commands (uncomment to actually register)
    // await client.createSlashCommand(null, pingCommand);
    // await client.createSlashCommand(null, userInfoCommand);
    // await client.createSlashCommand(null, sayCommand);
    // await client.createSlashCommand(null, mathCommand);
    // await client.createSlashCommand(null, pollCommand);
    
    console.log('📝 Slash commands defined (uncomment registration in code)');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
}

// ================ SLASH COMMAND HANDLERS ================

client.interactions.addSlashCommand('ping', async (interaction) => {
  const startTime = Date.now();
  
  // Show thinking state
  await interaction.defer();
  
  const apiLatency = Date.now() - startTime;
  
  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .setDescription('Bot latency information')
    .addField('API Latency', `${apiLatency}ms`, true)
    .addField('WebSocket Ping', `${client.ping}ms`, true)
    .addField('Status', client.ping < 100 ? '🟢 Excellent' : client.ping < 200 ? '🟡 Good' : '🔴 Poor', true)
    .setColor(client.ping < 100 ? 'success' : client.ping < 200 ? 'warning' : 'error')
    .setTimestamp()
    .setFooter('ryuziii.js performance');
  
  await interaction.editReply({ embeds: [embed] });
});

client.interactions.addSlashCommand('userinfo', async (interaction) => {
  await interaction.defer();
  
  const targetUser = interaction.getOption('user') || interaction.user.id;
  
  try {
    const user = await client.getUser(targetUser);
    
    const embed = new EmbedBuilder()
      .setTitle(`👤 User Information`)
      .setDescription(`Information about ${user.username}`)
      .addField('Username', user.username, true)
      .addField('Discriminator', `#${user.discriminator}`, true)
      .addField('ID', user.id, true)
      .addField('Bot', user.bot ? 'Yes' : 'No', true)
      .addField('Account Created', `<t:${Math.floor(((user.id / 4194304) + 1420070400000) / 1000)}:F>`, false)
      .setThumbnail(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
      .setColor('info')
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply('❌ Could not fetch user information!');
  }
});

client.interactions.addSlashCommand('say', async (interaction) => {
  const message = interaction.getOption('message');
  const useEmbed = interaction.getOption('embed') || false;
  
  if (useEmbed) {
    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor('discord')
      .setFooter('Said by ' + interaction.user.username);
    
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply(message);
  }
});

client.interactions.addSlashCommand('math', async (interaction) => {
  const subcommand = interaction.data.options[0].name;
  const first = interaction.data.options[0].options.find(opt => opt.name === 'first').value;
  const second = interaction.data.options[0].options.find(opt => opt.name === 'second').value;
  
  let result;
  let operation;
  
  switch (subcommand) {
    case 'add':
      result = first + second;
      operation = '+';
      break;
    case 'multiply':
      result = first * second;
      operation = '×';
      break;
    default:
      await interaction.reply('❌ Unknown math operation!');
      return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('🧮 Math Result')
    .setDescription(`${first} ${operation} ${second} = **${result}**`)
    .setColor('success')
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
});

client.interactions.addSlashCommand('poll', async (interaction) => {
  const question = interaction.getOption('question');
  const option1 = interaction.getOption('option1');
  const option2 = interaction.getOption('option2');
  const option3 = interaction.getOption('option3');
  
  const embed = new EmbedBuilder()
    .setTitle('📊 Poll')
    .setDescription(question)
    .addField('1️⃣', option1, false)
    .addField('2️⃣', option2, false)
    .setColor('discord')
    .setFooter('React to vote!')
    .setTimestamp();
  
  if (option3) {
    embed.addField('3️⃣', option3, false);
  }
  
  const message = await interaction.reply({ embeds: [embed], fetchReply: true });
  
  // Add reactions
  await client.addReaction(interaction.channel_id, message.id, '1️⃣');
  await client.addReaction(interaction.channel_id, message.id, '2️⃣');
  if (option3) {
    await client.addReaction(interaction.channel_id, message.id, '3️⃣');
  }
});

// ================ MESSAGE COMMANDS (for comparison) ================

client.on('messageCreate', async (message) => {
  if (message.author?.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).split(' ');
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'embed':
      const embedExample = new EmbedBuilder()
        .setTitle('🎨 Embed Showcase')
        .setDescription('This is what embeds look like with ryuziii.js!')
        .addField('Easy to use', 'Chain methods for quick building', true)
        .addField('Powerful', 'All Discord embed features supported', true)
        .addField('Type-safe', 'Built-in validation and error checking', false)
        .setColor('discord')
        .setThumbnail(client.user.avatar ? `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png` : null)
        .setFooter('Made with ❤️ using ryuziii.js')
        .setTimestamp();
      
      await client.sendMessage(message.channel_id, { embeds: [embedExample] });
      break;

    case 'colors':
      const colorEmbed = new EmbedBuilder()
        .setTitle('🌈 Color Examples')
        .setDescription('ryuziii.js supports many color formats!');

      // Create multiple embeds with different colors
      const colors = [
        { name: 'Success', color: 'success' },
        { name: 'Error', color: 'error' },
        { name: 'Warning', color: 'warning' },
        { name: 'Info', color: 'info' },
        { name: 'Discord', color: 'discord' }
      ];

      for (const { name, color } of colors) {
        const embed = new EmbedBuilder()
          .setTitle(`${name} Color`)
          .setDescription(`This embed uses the '${color}' color`)
          .setColor(color);
        
        await client.sendMessage(message.channel_id, { embeds: [embed] });
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      }
      break;

    case 'builder':
      // Showcase MessageBuilder
      const msg = new MessageBuilder()
        .setContent('🛠️ This message was built with MessageBuilder!')
        .addEmbed(
          new EmbedBuilder()
            .setTitle('MessageBuilder Features')
            .addField('Content + Embeds', 'Easily combine text and embeds', false)
            .addField('Validation', 'Built-in message validation', false)
            .setColor('purple')
        );
      
      await client.sendMessage(message.channel_id, msg);
      break;

    case 'status':
      const statusArg = args[0];
      const activity = args.slice(1).join(' ');
      
      if (!statusArg) {
        await client.sendMessage(message.channel_id, '❌ Usage: `!status <online|idle|dnd|invisible> [activity]`');
        return;
      }
      
      switch (statusArg.toLowerCase()) {
        case 'online':
          client.setOnline(activity ? { name: activity, type: 0 } : null);
          await client.sendMessage(message.channel_id, '✅ Status set to Online' + (activity ? ` - Playing ${activity}` : ''));
          break;
        case 'idle':
          client.setIdle(activity ? { name: activity, type: 0 } : null);
          await client.sendMessage(message.channel_id, '🌙 Status set to Idle' + (activity ? ` - Playing ${activity}` : ''));
          break;
        case 'dnd':
          client.setDND(activity ? { name: activity, type: 0 } : null);
          await client.sendMessage(message.channel_id, '🔴 Status set to Do Not Disturb' + (activity ? ` - Playing ${activity}` : ''));
          break;
        case 'invisible':
          client.setInvisible();
          await client.sendMessage(message.channel_id, '👻 Status set to Invisible');
          break;
        default:
          await client.sendMessage(message.channel_id, '❌ Invalid status. Use: online, idle, dnd, or invisible');
      }
      break;

    case 'help':
      const helpEmbed = new EmbedBuilder()
        .setTitle('🤖 ryuziii.js Advanced Bot')
        .setDescription('Showcasing all the amazing features!')
        .addField('Slash Commands', '`/ping` `/userinfo` `/say` `/math` `/poll`', false)
        .addField('Message Commands', '`!embed` `!colors` `!builder` `!status` `!help`', false)
        .addField('Features', '• EmbedBuilder with color names\n• SlashCommandBuilder\n• MessageBuilder\n• Built-in client methods\n• Interaction handling\n• Memory management', false)
        .setColor('blurple')
        .setFooter('Built with ryuziii.js - High Performance Discord Library')
        .setTimestamp();
      
      await client.sendMessage(message.channel_id, { embeds: [helpEmbed] });
      break;
  }
});

// ================ ERROR HANDLING ================

client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

client.interactions.on('interactionError', (error, interaction) => {
  console.error('❌ Interaction error:', error);
  if (!interaction.replied && !interaction.deferred) {
    interaction.reply('❌ An error occurred while processing your command!').catch(console.error);
  }
});

client.interactions.on('unknownCommand', (interaction) => {
  console.log(`❓ Unknown command: ${interaction.data.name}`);
  interaction.reply('❌ Unknown command!').catch(console.error);
});

// ================ MEMORY MANAGEMENT ================

client.memoryManager.on('memoryWarning', (data) => {
  console.warn('⚠️ High memory usage:', `${Math.round(data.heapUsed / 1024 / 1024)}MB (${Math.round(data.usageRatio * 100)}%)`);
});

client.memoryManager.on('cleanupComplete', (data) => {
  console.log('🧹 Memory cleanup completed:', `${data.itemsCleared} items cleared`);
});

// ================ STARTUP ================

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ No Discord token provided. Set DISCORD_TOKEN environment variable.');
  process.exit(1);
}

console.log('🚀 Starting advanced ryuziii.js bot...');

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
