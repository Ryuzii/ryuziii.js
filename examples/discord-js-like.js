const { 
  Client, 
  Constants, 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder
} = require('../src/index');

// Create client like discord.js but better!
const client = new Client({
  intents: Constants.INTENTS.GUILDS | 
           Constants.INTENTS.GUILD_MESSAGES | 
           Constants.INTENTS.MESSAGE_CONTENT |
           Constants.INTENTS.GUILD_VOICE_STATES
});

client.on('ready', () => {
  console.log(`🚀 ${client.user.username} is ready!`);

  client.setDND()
  
  // Just like discord.js presence!
  client.setCustomStatus('Vibing with ryuziii.js', '🎵');
  
  console.log('✨ All Discord.js-like features loaded!');
});

// Message events with convenient methods
client.on('messageCreate', async (message) => {
  // Ignore bots
  if (message.isBot) return;

  // Discord.js-like message.reply()!
  if (message.content === '!ping') {
    await message.reply('🏓 Pong!');
  }

  // message.channel.send() just like discord.js!
  if (message.content === '!hello') {
    await message.channel.send('Hello there! 👋');
  }

  // Beautiful embeds with reply
  if (message.content === '!embed') {
    const embed = new EmbedBuilder()
      .setTitle('✨ Beautiful Embed')
      .setDescription('This works just like discord.js but better!')
      .setColor('success')
      .addField('Performance', 'Super fast! ⚡', true)
      .addField('Memory', 'Very efficient! 💾', true)
      .setThumbnail('https://cdn.discordapp.com/emojis/123456789.png')
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }

  // Buttons and components!
  if (message.content === '!buttons') {
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('success_btn')
          .setLabel('Success')
          .setStyle('success')
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('danger_btn')
          .setLabel('Danger')
          .setStyle('danger')
          .setEmoji('❌'),
        new ButtonBuilder()
          .setURL('https://github.com/ryuzii/ryuziii.js')
          .setLabel('GitHub')
          .setStyle('link')
          .setEmoji('🔗')
      );

    const embed = new EmbedBuilder()
      .setTitle('🎮 Interactive Buttons')
      .setDescription('Click the buttons below!')
      .setColor('discord');

    await message.reply({ embeds: [embed], components: [buttons] });
  }

  // Select menus
  if (message.content === '!menu') {
    const selectMenu = new SelectMenuBuilder()
      .setCustomId('color_select')
      .setPlaceholder('Choose your favorite color!')
      .addOptions(
        new SelectMenuOptionBuilder()
          .setLabel('Red')
          .setValue('red')
          .setDescription('The color of passion')
          .setEmoji('🔴'),
        new SelectMenuOptionBuilder()
          .setLabel('Blue')
          .setValue('blue')
          .setDescription('The color of calm')
          .setEmoji('🔵'),
        new SelectMenuOptionBuilder()
          .setLabel('Green')
          .setValue('green')
          .setDescription('The color of nature')
          .setEmoji('🟢')
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await message.reply({ 
      content: 'Choose your favorite color:',
      components: [row] 
    });
  }

  // Modal example
  if (message.content === '!feedback') {
    const modal = new ModalBuilder()
      .setCustomId('feedback_modal')
      .setTitle('Feedback Form');

    const titleInput = new TextInputBuilder()
      .setCustomId('feedback_title')
      .setLabel('Title')
      .setStyle('short')
      .setPlaceholder('Enter a title...')
      .setRequired(true);

    const feedbackInput = new TextInputBuilder()
      .setCustomId('feedback_content')
      .setLabel('Your Feedback')
      .setStyle('paragraph')
      .setPlaceholder('Tell us what you think...')
      .setMaxLength(1000)
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(feedbackInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // This would typically be in an interaction, but showing for example
    console.log('Modal created:', modal.toJSON());
    await message.reply('Modal example created! (Check console)');
  }

  // Music bot commands with voice
  if (message.content === '!join') {
    // Get user's voice channel (you'd need to get this from voice states)
    const guildId = message.guild_id;
    const channelId = '1395465815494623295'; // You'd get this from voice state
    
    try {
      await client.joinVoiceChannel(guildId, channelId);
      await message.react('✅');
      await message.reply('🎵 Joined voice channel!');
    } catch (error) {
      await message.reply('❌ Could not join voice channel!');
    }
  }

  if (message.content === '!leave') {
    try {
      await client.leaveVoiceChannel(message.guild_id);
      await message.react('👋');
      await message.reply('👋 Left voice channel!');
    } catch (error) {
      await message.reply('❌ Could not leave voice channel!');
    }
  }

  // Status commands
  if (message.content.startsWith('!playing ')) {
    const game = message.content.slice(9);
    client.setPlaying(game);
    await message.reply(`🎮 Now playing: **${game}**`);
  }

  if (message.content.startsWith('!listening ')) {
    const music = message.content.slice(11);
    client.setListening(music);
    await message.reply(`🎵 Now listening to: **${music}**`);
  }

  if (message.content.startsWith('!watching ')) {
    const show = message.content.slice(10);
    client.setWatching(show);
    await message.reply(`📺 Now watching: **${show}**`);
  }

  // Help command
  if (message.content === '!help') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Discord.js-like Bot Commands')
      .setDescription('All the features you love from discord.js, but better!')
      .addField('Basic Commands', '`!ping` `!hello` `!embed`', false)
      .addField('Interactive', '`!buttons` `!menu` `!feedback`', false)
      .addField('Voice', '`!join` `!leave`', false)
      .addField('Status', '`!playing <game>` `!listening <music>` `!watching <show>`', false)
      .setColor('blurple')
      .setFooter('Made with ❤️ using ryuziii.js')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
});

// Button interactions
client.interactions.addButton('success_btn', async (interaction) => {
  const embed = new EmbedBuilder()
    .setTitle('✅ Success!')
    .setDescription('You clicked the success button!')
    .setColor('success');
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
});

client.interactions.addButton('danger_btn', async (interaction) => {
  const embed = new EmbedBuilder()
    .setTitle('❌ Danger!')
    .setDescription('You clicked the danger button!')
    .setColor('error');
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
});

// Select menu interactions
client.interactions.addSelectMenu('color_select', async (interaction) => {
  const selectedColor = interaction.getValues()[0];
  const colors = {
    red: { name: 'Red', emoji: '🔴', color: 'error' },
    blue: { name: 'Blue', emoji: '🔵', color: 'info' },
    green: { name: 'Green', emoji: '🟢', color: 'success' }
  };
  
  const colorData = colors[selectedColor];
  
  const embed = new EmbedBuilder()
    .setTitle(`${colorData.emoji} You chose ${colorData.name}!`)
    .setDescription(`Great choice! ${colorData.name} is a beautiful color.`)
    .setColor(colorData.color);
  
  await interaction.update({ embeds: [embed], components: [] });
});

// Modal interactions
client.interactions.addModal('feedback_modal', async (interaction) => {
  const title = interaction.getFieldValue('feedback_title');
  const content = interaction.getFieldValue('feedback_content');
  
  const embed = new EmbedBuilder()
    .setTitle('📝 Feedback Received!')
    .addField('Title', title, false)
    .addField('Content', content, false)
    .setColor('success')
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed] });
  
  console.log('Feedback received:', { title, content });
});

// Advanced presence examples
setInterval(() => {
  const activities = [
    () => client.setPlaying('with ryuziii.js'),
    () => client.setListening('music in voice'),
    () => client.setWatching('Discord servers'),
    () => client.setCustomStatus('Coding with ryuziii.js', '💻'),
    () => client.setCompeting('in Discord bots')
  ];
  
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];
  randomActivity();
}, 30000); // Change every 30 seconds

// Error handling
client.on('error', (error) => {
  console.error('❌ Client error:', error);
});

// Login
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ No Discord token provided. Set DISCORD_TOKEN environment variable.');
  process.exit(1);
}

console.log('🚀 Starting Discord.js-like bot with ryuziii.js...');
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
