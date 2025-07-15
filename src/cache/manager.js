const BaseCache = require('./base');

// Manages multiple caches for different Discord objects
class CacheManager {
  constructor(options = {}) {
    const Cache = options.cacheAdapter || BaseCache;
    this.users = options.usersCache || new Cache(options.usersOptions);
    this.guilds = options.guildsCache || new Cache(options.guildsOptions);
    this.channels = options.channelsCache || new Cache(options.channelsOptions);
    this.messages = options.messagesCache || new Cache(options.messagesOptions);
    // Add more as needed
  }

  sweepAll() {
    this.users.clear();
    this.guilds.clear();
    this.channels.clear();
    this.messages.clear();
  }
}

module.exports = CacheManager; 