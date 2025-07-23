const EventEmitter = require('events');
const Shard = require('./Shard');

class ShardManager extends EventEmitter {
  constructor(file, options = {}) {
    super();
    
    this.file = file;
    this.totalShards = options.totalShards || 'auto';
    this.shardList = options.shardList || 'auto';
    this.mode = options.mode || 'process';
    this.respawn = options.respawn !== false;
    this.shardArgs = options.shardArgs || [];
    this.execArgv = options.execArgv || [];
    this.token = options.token || null;
    
    this.shards = new Map();
    this.shardQueue = new Set();
    this.packetQueue = [];
    
    this.spawning = false;
    this.spawnTimeout = options.spawnTimeout || 30000;
    this.spawnDelay = options.spawnDelay || 5500;
  }

  async spawn(amount = this.totalShards, delay = this.spawnDelay, timeout = this.spawnTimeout) {
    if (amount === 'auto') {
      amount = await this.fetchRecommendedShards();
    }

    this.totalShards = amount;
    this.spawning = true;

    for (let i = 0; i < amount; i++) {
      if (this.shards.has(i)) continue;
      
      const promises = [this.createShard(i)];
      
      if (delay > 0 && i !== amount - 1) {
        promises.push(this.sleep(delay));
      }

      await Promise.all(promises);
    }

    this.spawning = false;
    return this.shards;
  }

  async createShard(id) {
    const shard = new Shard(this, id);
    this.shards.set(id, shard);

    shard.on('spawn', () => {
      this.emit('shardCreate', shard);
    });

    shard.on('death', () => {
      this.emit('shardDestroy', shard);
      if (this.respawn) {
        this.respawnShard(id);
      }
    });

    shard.on('ready', () => {
      this.emit('shardReady', shard);
    });

    shard.on('disconnect', () => {
      this.emit('shardDisconnect', shard);
    });

    shard.on('reconnecting', () => {
      this.emit('shardReconnecting', shard);
    });

    shard.on('message', (message) => {
      this.emit('shardMessage', shard, message);
    });

    shard.on('error', (error) => {
      this.emit('shardError', shard, error);
    });

    await shard.spawn(this.spawnTimeout);
    return shard;
  }

  async respawnShard(id) {
    const shard = this.shards.get(id);
    if (!shard) return;

    await shard.kill();
    await this.createShard(id);
  }

  async respawnAll(spawnDelay = this.spawnDelay, respawnDelay = 500, timeout = this.spawnTimeout) {
    let s = 0;
    for (const shard of this.shards.values()) {
      const promises = [shard.respawn(spawnDelay, timeout)];
      if (++s < this.shards.size && respawnDelay > 0) promises.push(this.sleep(respawnDelay));
      await Promise.all(promises);
    }
    return this.shards;
  }

  broadcast(message) {
    const promises = [];
    for (const shard of this.shards.values()) {
      promises.push(shard.send(message));
    }
    return Promise.all(promises);
  }

  broadcastEval(script, context = {}) {
    const promises = [];
    for (const shard of this.shards.values()) {
      promises.push(shard.eval(script, context));
    }
    return Promise.all(promises);
  }

  async fetchClientValues(prop) {
    if (this.shards.size === 0) return null;
    if (this.shards.size !== this.totalShards) return null;

    const results = await this.broadcastEval(`this.${prop}`);
    return results;
  }

  async fetchRecommendedShards() {
    if (!this.token) throw new Error('Token is required to fetch recommended shards');
    
    const fetch = require('node-fetch');
    const response = await fetch('https://discord.com/api/v10/gateway/bot', {
      headers: { Authorization: `Bot ${this.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gateway info: ${response.status}`);
    }
    
    const data = await response.json();
    return data.shards;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get totalGuilds() {
    return this.shards.reduce((total, shard) => total + (shard.guildCount || 0), 0);
  }

  get totalUsers() {
    return this.shards.reduce((total, shard) => total + (shard.userCount || 0), 0);
  }

  get averageLatency() {
    const latencies = this.shards.map(shard => shard.ping).filter(ping => ping !== -1);
    return latencies.length ? latencies.reduce((a, b) => a + b) / latencies.length : -1;
  }
}

module.exports = ShardManager;
