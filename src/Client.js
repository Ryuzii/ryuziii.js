const EventEmitter = require('events');
const fetch = require('node-fetch');
const WebSocketManager = require('./gateway/WebSocketManager');
const Collection = require('./utils/Collection');
const Constants = require('./utils/Constants');
const MemoryManager = require('./utils/MemoryManager');
const LRUCache = require('./utils/cache/LRUCache');
const { InteractionManager } = require('./managers/InteractionManager');
const MessageBuilder = require('./builders/MessageBuilder');
const EmbedBuilder = require('./builders/EmbedBuilder');
const Message = require('./structures/Message');

class Client extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.token = null;
    this.user = null;
    this.options = {
      intents: options.intents || 0,
      largeThreshold: options.largeThreshold || 50,
      maxCacheSize: options.maxCacheSize || 1000,
      restRequestTimeout: options.restRequestTimeout || 15000,
      retryLimit: options.retryLimit || 3,
      ...options
    };

    this.guilds = new Collection().setMaxSize(this.options.maxCacheSize);
    this.channels = new Collection().setMaxSize(this.options.maxCacheSize * 5);
    this.users = new Collection().setMaxSize(this.options.maxCacheSize * 10);
    this.voiceStates = new Collection().setMaxSize(this.options.maxCacheSize);
    
    // Performance optimizations
    this.memoryManager = new MemoryManager({
      maxMemoryUsage: this.options.maxMemoryUsage || 512 * 1024 * 1024,
      monitoring: this.options.memoryMonitoring !== false,
      autoCleanup: this.options.autoCleanup !== false
    });
    
    // Register collections for memory management
    this.memoryManager.registerCollection(this.guilds);
    this.memoryManager.registerCollection(this.channels);
    this.memoryManager.registerCollection(this.users);
    this.memoryManager.registerCollection(this.voiceStates);
    
    // Message cache with TTL
    this.messageCache = new LRUCache(this.options.messageCacheSize || 1000);

    this.ws = new WebSocketManager(this);
    this.rest = new RESTManager(this);
    this.interactions = new InteractionManager(this);
    this.readyAt = null;

    this.setupWebSocketEvents();
  }

  setupWebSocketEvents() {
    this.ws.on('dispatch', ({ event, data }) => {
      this.handleEvent(event, data);
    });

    this.ws.on('open', () => {
      this.emit('debug', 'WebSocket connection opened');
    });

    this.ws.on('close', (code, reason) => {
      this.emit('debug', `WebSocket closed: ${code} - ${reason}`);
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async login(token) {
    this.token = token;
    
    try {
      const gatewayInfo = await this.rest.request('GET', '/gateway/bot');
      await this.ws.connect(gatewayInfo.url);
    } catch (error) {
      this.emit('error', error);
    }
  }

  handleEvent(event, data) {
    switch (event) {
      case 'READY':
        this.user = data.user;
        this.readyAt = new Date();
        this.emit('ready');
        break;
      
      case 'GUILD_CREATE':
        this.guilds.set(data.id, data);
        this.emit('guildCreate', data);
        break;
      
      case 'GUILD_DELETE':
        const guild = this.guilds.get(data.id);
        this.guilds.delete(data.id);
        this.emit('guildDelete', guild || data);
        break;
      
      case 'CHANNEL_CREATE':
        this.channels.set(data.id, data);
        this.emit('channelCreate', data);
        break;
      
      case 'CHANNEL_DELETE':
        const channel = this.channels.get(data.id);
        this.channels.delete(data.id);
        this.emit('channelDelete', channel || data);
        break;
      
      case 'MESSAGE_CREATE':
        // Cache message for performance
        this.messageCache.set(data.id, data);
        const message = new Message(this, data);
        this.emit('messageCreate', message);
        break;
      
      case 'MESSAGE_UPDATE':
        this.emit('messageUpdate', data);
        break;
      
      case 'MESSAGE_DELETE':
        this.emit('messageDelete', data);
        break;
      
      case 'VOICE_STATE_UPDATE':
        if (data.user_id) {
          this.voiceStates.set(`${data.guild_id}_${data.user_id}`, data);
        }
        this.emit('voiceStateUpdate', data);
        break;
      
      case 'VOICE_SERVER_UPDATE':
        this.emit('voiceServerUpdate', data);
        break;
      
      case 'INTERACTION_CREATE':
        this.interactions.handleInteraction(data);
        this.emit('interactionCreate', data);
        break;
      
      default:
        this.emit('raw', { event, data });
        break;
    }
  }

  destroy() {
    this.ws.disconnect();
    this.memoryManager.destroy();
    this.messageCache.clear();
    this.removeAllListeners();
  }

  get uptime() {
    return this.readyAt ? Date.now() - this.readyAt.getTime() : null;
  }

  get ping() {
    return this.ws.ping || -1;
  }

  // =================== CONVENIENCE METHODS ===================
  
  // Send a message to a channel
  async sendMessage(channelId, options) {
    let data;
    if (typeof options === 'string') {
      data = { content: options };
    } else if (options instanceof MessageBuilder || options instanceof EmbedBuilder) {
      data = options.toJSON();
    } else {
      data = options;
    }

    return this.rest.request('POST', `/channels/${channelId}/messages`, data);
  }

  // Edit a message
  async editMessage(channelId, messageId, options) {
    let data;
    if (typeof options === 'string') {
      data = { content: options };
    } else if (options instanceof MessageBuilder || options instanceof EmbedBuilder) {
      data = options.toJSON();
    } else {
      data = options;
    }

    return this.rest.request('PATCH', `/channels/${channelId}/messages/${messageId}`, data);
  }

  // Delete a message
  async deleteMessage(channelId, messageId) {
    return this.rest.request('DELETE', `/channels/${channelId}/messages/${messageId}`);
  }

  // Get a message
  async getMessage(channelId, messageId) {
    // Check cache first
    const cached = this.messageCache.get(messageId);
    if (cached) return cached;

    const message = await this.rest.request('GET', `/channels/${channelId}/messages/${messageId}`);
    this.messageCache.set(messageId, message);
    return message;
  }

  // Get multiple messages
  async getMessages(channelId, options = {}) {
    const query = new URLSearchParams();
    if (options.limit) query.set('limit', options.limit);
    if (options.before) query.set('before', options.before);
    if (options.after) query.set('after', options.after);
    if (options.around) query.set('around', options.around);

    const url = `/channels/${channelId}/messages${query.toString() ? '?' + query.toString() : ''}`;
    return this.rest.request('GET', url);
  }

  // Add reaction to message
  async addReaction(channelId, messageId, emoji) {
    const encodedEmoji = encodeURIComponent(emoji);
    return this.rest.request('PUT', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`);
  }

  // Remove reaction from message
  async removeReaction(channelId, messageId, emoji, userId = '@me') {
    const encodedEmoji = encodeURIComponent(emoji);
    return this.rest.request('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/${userId}`);
  }

  // Get guild
  async getGuild(guildId) {
    const cached = this.guilds.get(guildId);
    if (cached) return cached;

    const guild = await this.rest.request('GET', `/guilds/${guildId}`);
    this.guilds.set(guildId, guild);
    return guild;
  }

  // Get channel
  async getChannel(channelId) {
    const cached = this.channels.get(channelId);
    if (cached) return cached;

    const channel = await this.rest.request('GET', `/channels/${channelId}`);
    this.channels.set(channelId, channel);
    return channel;
  }

  // Get user
  async getUser(userId) {
    const cached = this.users.get(userId);
    if (cached) return cached;

    const user = await this.rest.request('GET', `/users/${userId}`);
    this.users.set(userId, user);
    return user;
  }

  // Get guild member
  async getGuildMember(guildId, userId) {
    return this.rest.request('GET', `/guilds/${guildId}/members/${userId}`);
  }

  // Kick member
  async kickMember(guildId, userId, reason = null) {
    const headers = {};
    if (reason) headers['X-Audit-Log-Reason'] = reason;
    return this.rest.request('DELETE', `/guilds/${guildId}/members/${userId}`, null, headers);
  }

  // Ban member
  async banMember(guildId, userId, options = {}) {
    const headers = {};
    if (options.reason) headers['X-Audit-Log-Reason'] = options.reason;
    
    const data = {};
    if (options.deleteMessageSeconds) data.delete_message_seconds = options.deleteMessageSeconds;
    
    return this.rest.request('PUT', `/guilds/${guildId}/bans/${userId}`, data, headers);
  }

  // Unban member
  async unbanMember(guildId, userId, reason = null) {
    const headers = {};
    if (reason) headers['X-Audit-Log-Reason'] = reason;
    return this.rest.request('DELETE', `/guilds/${guildId}/bans/${userId}`, null, headers);
  }

  // Create slash command
  async createSlashCommand(guildId, command) {
    const data = command.toJSON ? command.toJSON() : command;
    const endpoint = guildId 
      ? `/applications/${this.user.id}/guilds/${guildId}/commands`
      : `/applications/${this.user.id}/commands`;
    
    return this.rest.request('POST', endpoint, data);
  }

  // Get slash commands
  async getSlashCommands(guildId = null) {
    const endpoint = guildId 
      ? `/applications/${this.user.id}/guilds/${guildId}/commands`
      : `/applications/${this.user.id}/commands`;
    
    return this.rest.request('GET', endpoint);
  }

  // Delete slash command
  async deleteSlashCommand(commandId, guildId = null) {
    const endpoint = guildId 
      ? `/applications/${this.user.id}/guilds/${guildId}/commands/${commandId}`
      : `/applications/${this.user.id}/commands/${commandId}`;
    
    return this.rest.request('DELETE', endpoint);
  }

  // Set presence/status
  setPresence(presence) {
    this.ws.send({
      op: Constants.OPCODES.PRESENCE_UPDATE,
      d: presence
    });
  }

  // Set status
  setStatus(status, activity = null) {
    const presence = {
      since: null,
      activities: activity ? [activity] : [],
      status: status,
      afk: false
    };
    this.setPresence(presence);
  }

  // Quick status methods
  setOnline(activity = null) {
    this.setStatus('online', activity);
  }

  setIdle(activity = null) {
    this.setStatus('idle', activity);
  }

  setDND(activity = null) {
    this.setStatus('dnd', activity);
  }

  setInvisible() {
    this.setStatus('invisible');
  }

  // Set activity
  setActivity(name, options = {}) {
    const activity = {
      name: name,
      type: options.type || 0, // PLAYING
      url: options.url || null,
      state: options.state || null
    };
    this.setStatus(this.presence?.status || 'online', activity);
  }

  // Advanced presence management
  setCustomStatus(state, emoji = null) {
    const activity = {
      name: 'Custom Status',
      type: 4, // CUSTOM
      state: state,
      emoji: emoji ? { name: emoji } : null
    };
    this.setStatus(this.presence?.status || 'online', activity);
  }

  // Activity type shortcuts
  setPlaying(name) {
    this.setActivity(name, { type: 0 });
  }

  setStreaming(name, url) {
    this.setActivity(name, { type: 1, url });
  }

  setListening(name) {
    this.setActivity(name, { type: 2 });
  }

  setWatching(name) {
    this.setActivity(name, { type: 3 });
  }

  setCompeting(name) {
    this.setActivity(name, { type: 5 });
  }

  // Join voice channel
  async joinVoiceChannel(guildId, channelId, options = {}) {
    this.ws.send({
      op: Constants.OPCODES.VOICE_STATE_UPDATE,
      d: {
        guild_id: guildId,
        channel_id: channelId,
        self_mute: options.selfMute || false,
        self_deaf: options.selfDeaf || false
      }
    });
  }

  // Leave voice channel
  async leaveVoiceChannel(guildId) {
    this.ws.send({
      op: Constants.OPCODES.VOICE_STATE_UPDATE,
      d: {
        guild_id: guildId,
        channel_id: null,
        self_mute: false,
        self_deaf: false
      }
    });
  }
}

class RESTManager {
  constructor(client) {
    this.client = client;
    this.baseURL = Constants.API.BASE_URL;
    this.userAgent = `DiscordBot (ryuziii.js, ${require('../package.json').version})`;
  }

  async request(method, endpoint, body = null, extraHeaders = {}, retries = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bot ${this.client.token}`,
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
        ...extraHeaders
      },
      timeout: this.client.options.restRequestTimeout
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        if (retries < this.client.options.retryLimit) {
          await this.sleep(parseInt(retryAfter) * 1000);
          return this.request(method, endpoint, body, extraHeaders, retries + 1);
        }
        throw new Error(`Rate limited after ${retries} retries`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    } catch (error) {
      if (retries < this.client.options.retryLimit) {
        await this.sleep(1000 * Math.pow(2, retries));
        return this.request(method, endpoint, body, extraHeaders, retries + 1);
      }
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Client;
