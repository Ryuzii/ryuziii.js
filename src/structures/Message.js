const MessageBuilder = require('../builders/MessageBuilder');
const EmbedBuilder = require('../builders/EmbedBuilder');

class Message {
  constructor(client, data) {
    this.client = client;
    this.id = data.id;
    this.channel_id = data.channel_id;
    this.guild_id = data.guild_id;
    this.author = data.author;
    this.member = data.member;
    this.content = data.content;
    this.timestamp = data.timestamp;
    this.edited_timestamp = data.edited_timestamp;
    this.tts = data.tts;
    this.mention_everyone = data.mention_everyone;
    this.mentions = data.mentions || [];
    this.mention_roles = data.mention_roles || [];
    this.mention_channels = data.mention_channels || [];
    this.attachments = data.attachments || [];
    this.embeds = data.embeds || [];
    this.reactions = data.reactions || [];
    this.nonce = data.nonce;
    this.pinned = data.pinned;
    this.webhook_id = data.webhook_id;
    this.type = data.type;
    this.activity = data.activity;
    this.application = data.application;
    this.application_id = data.application_id;
    this.message_reference = data.message_reference;
    this.flags = data.flags;
    this.referenced_message = data.referenced_message;
    this.interaction = data.interaction;
    this.thread = data.thread;
    this.components = data.components || [];
    this.sticker_items = data.sticker_items || [];
    this.stickers = data.stickers || [];
    
    // Create channel object
    this.channel = new MessageChannel(client, data.channel_id, data.guild_id);
  }

  // Reply to the message
  async reply(options) {
    let data;
    if (typeof options === 'string') {
      data = { 
        content: options,
        message_reference: {
          message_id: this.id,
          channel_id: this.channel_id,
          guild_id: this.guild_id
        }
      };
    } else if (options instanceof MessageBuilder || options instanceof EmbedBuilder) {
      data = {
        ...options.toJSON(),
        message_reference: {
          message_id: this.id,
          channel_id: this.channel_id,
          guild_id: this.guild_id
        }
      };
    } else {
      data = {
        ...options,
        message_reference: {
          message_id: this.id,
          channel_id: this.channel_id,
          guild_id: this.guild_id
        }
      };
    }

    return this.client.sendMessage(this.channel_id, data);
  }

  // Edit this message
  async edit(options) {
    return this.client.editMessage(this.channel_id, this.id, options);
  }

  // Delete this message
  async delete() {
    return this.client.deleteMessage(this.channel_id, this.id);
  }

  // Add reaction to this message
  async react(emoji) {
    return this.client.addReaction(this.channel_id, this.id, emoji);
  }

  // Remove reaction from this message
  async removeReaction(emoji, userId = '@me') {
    return this.client.removeReaction(this.channel_id, this.id, emoji, userId);
  }

  // Pin this message
  async pin() {
    return this.client.rest.request('PUT', `/channels/${this.channel_id}/pins/${this.id}`);
  }

  // Unpin this message
  async unpin() {
    return this.client.rest.request('DELETE', `/channels/${this.channel_id}/pins/${this.id}`);
  }

  // Start thread from this message
  async startThread(options) {
    const data = {
      name: options.name || 'Thread',
      auto_archive_duration: options.autoArchiveDuration || 60,
      type: options.type || 11,
      rate_limit_per_user: options.rateLimitPerUser || null
    };

    return this.client.rest.request('POST', `/channels/${this.channel_id}/messages/${this.id}/threads`, data);
  }

  // Crosspost message (if in announcement channel)
  async crosspost() {
    return this.client.rest.request('POST', `/channels/${this.channel_id}/messages/${this.id}/crosspost`);
  }

  // Check if message mentions a user
  mentions(user) {
    const userId = typeof user === 'string' ? user : user.id;
    return this.mentions.some(mention => mention.id === userId);
  }

  // Check if message was sent by a bot
  get isBot() {
    return this.author?.bot || false;
  }

  // Get message URL
  get url() {
    const guildPart = this.guild_id ? `/channels/${this.guild_id}` : '/channels/@me';
    return `https://discord.com${guildPart}/${this.channel_id}/${this.id}`;
  }

  // Get message creation date
  get createdAt() {
    return new Date(this.timestamp);
  }

  // Get message edit date
  get editedAt() {
    return this.edited_timestamp ? new Date(this.edited_timestamp) : null;
  }

  // Check if message was edited
  get edited() {
    return !!this.edited_timestamp;
  }

  toString() {
    return this.content;
  }
}

class MessageChannel {
  constructor(client, channelId, guildId = null) {
    this.client = client;
    this.id = channelId;
    this.guild_id = guildId;
  }

  // Send message to this channel
  async send(options) {
    return this.client.sendMessage(this.id, options);
  }

  // Get messages from this channel
  async messages(options = {}) {
    return this.client.getMessages(this.id, options);
  }

  // Bulk delete messages
  async bulkDelete(messages) {
    const messageIds = messages.map(msg => typeof msg === 'string' ? msg : msg.id);
    return this.client.rest.request('POST', `/channels/${this.id}/messages/bulk-delete`, {
      messages: messageIds
    });
  }

  // Start typing in this channel
  async sendTyping() {
    return this.client.rest.request('POST', `/channels/${this.id}/typing`);
  }

  // Create webhook in this channel
  async createWebhook(options) {
    return this.client.rest.request('POST', `/channels/${this.id}/webhooks`, {
      name: options.name,
      avatar: options.avatar || null
    });
  }

  // Get channel info
  async fetch() {
    return this.client.getChannel(this.id);
  }
}

module.exports = Message;
