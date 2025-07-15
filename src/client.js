const { Gateway, EventEmitter, RestClient } = require('./core');
const { CacheManager } = require('./cache');
const { resolveIntents } = require('./core/intents');
const Logger = require('./core/logger');

function toCamelCase(event) {
  return event.toLowerCase().replace(/_([a-z])/g, (m, l) => l.toUpperCase());
}

function patchMessage(msg, client) {
  // Reply to the message (mentions user, uses message_reference)
  msg.reply = async function(content) {
    const data = typeof content === 'string' ? { content } : { ...content };
    data.message_reference = { message_id: msg.id, channel_id: msg.channel_id, guild_id: msg.guild_id };
    if (!data.allowed_mentions) {
      data.allowed_mentions = { replied_user: true };
    }
    return client.rest.request('POST', `/channels/${msg.channel_id}/messages`, data);
  };
  // Channel send (plain message to channel, no mention)
  msg.channel = {
    send: async function(content) {
      const data = typeof content === 'string' ? { content } : { ...content };
      return client.rest.request('POST', `/channels/${msg.channel_id}/messages`, data);
    }
  };
  return msg;
}

function patchInteraction(interaction, client) {
  // Reply to the interaction
  interaction.reply = async function(content) {
    const data = typeof content === 'string' ? { content } : { ...content };
    return client.rest.request('POST', `/interactions/${interaction.id}/${interaction.token}/callback`, {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data
    });
  };
  // Edit the original reply
  interaction.editReply = async function(content) {
    const data = typeof content === 'string' ? { content } : { ...content };
    return client.rest.request('PATCH', `/webhooks/${client.gateway.user?.id || 'YOUR_CLIENT_ID'}/${interaction.token}/messages/@original`, data);
  };
  // Defer the reply
  interaction.deferReply = async function() {
    return client.rest.request('POST', `/interactions/${interaction.id}/${interaction.token}/callback`, {
      type: 5 // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    });
  };
  return interaction;
}

class RyuziiClient extends EventEmitter {
  constructor(options = {}) {
    super();
    if (!options.token) {
      throw new Error('[ryuziii.js] No token provided! Please pass a bot token to the Client.');
    }
    if (!options.intents) {
      console.warn('[ryuziii.js] Warning: No intents provided. Defaulting to 513 (GUILDS + GUILD_MESSAGES).');
    }
    this.token = options.token;
    this.intents = resolveIntents(options.intents || 513);
    this.logger = new Logger(options.logger || {});
    this.rest = new RestClient(this.token);
    this.gateway = new Gateway(this.token, this.intents);
    this.cache = new CacheManager(options.cacheOptions);

    this.slash = {
      set: async (commands, guildId) => {
        const appId = this.gateway.user?.id || 'YOUR_CLIENT_ID';
        if (!guildId) throw new Error('guildId is required for per-guild slash command registration.');
        return this.rest.request('PUT', `/applications/${appId}/guilds/${guildId}/commands`, commands);
      },
      setGlobal: async (commands) => {
        const appId = this.gateway.user?.id || 'YOUR_CLIENT_ID';
        return this.rest.request('PUT', `/applications/${appId}/commands`, commands);
      }
    };

    this.gateway.onEvent = (payload) => this._handleEvent(payload);
    this._patchGatewayLogging();
  }

  _patchGatewayLogging() {
    if (!this.gateway) return;
    const ws = this.gateway.ws;
    // Patch after connect
    const origConnect = this.gateway.connect.bind(this.gateway);
    this.gateway.connect = () => {
      this.logger.info('Connecting to Discord Gateway...');
      origConnect();
      // Wait for ws to be set
      setTimeout(() => {
        if (this.gateway.ws) {
          this.gateway.ws.on('open', () => this.logger.info('Gateway connection established.'));
          this.gateway.ws.on('close', (code, reason) => this.logger.warn('Gateway connection closed.', code, reason));
          this.gateway.ws.on('error', (err) => this.logger.error('Gateway connection error:', err));
        }
      }, 0);
    };
  }

  _handleEvent(payload) {
    if (payload.t) {
      const camel = toCamelCase(payload.t);
      let data = payload.d;
      // Patch message for messageCreate
      if (camel === 'messageCreate') {
        data = patchMessage(data, this);
      }
      // Patch interaction for interactionCreate
      if (camel === 'interactionCreate') {
        data = patchInteraction(data, this);
      }
      this.emit(payload.t, data); // RAW event
      this.emit(camel, data); // camelCase event
    }
    this.emit('RAW', payload);
  }

  login(token) {
    if (token) this.token = token;
    if (!this.token) {
      throw new Error('[ryuziii.js] No token provided to login().');
    }
    this.gateway.token = this.token;
    this.rest.token = this.token;
    this.gateway.connect();
  }
}

module.exports = RyuziiClient; 