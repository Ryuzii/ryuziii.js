const Shard = require('./shard');
const EventEmitter = require('../core/events');

class ShardingManager extends EventEmitter {
  constructor(token, options = {}) {
    super();
    this.token = token;
    this.shardCount = options.shardCount || 1;
    this.intents = options.intents || 513;
    this.shards = [];
  }

  spawn() {
    for (let i = 0; i < this.shardCount; i++) {
      const shard = new Shard(this.token, i, this.shardCount, this.intents);
      this.shards.push(shard);
      this._listenShardEvents(shard);
      shard.connect();
    }
  }

  _listenShardEvents(shard) {
    shard.on('shardReady', (id) => this.emit('shardReady', id));
    shard.on('shardDisconnect', (id) => this.emit('shardDisconnect', id));
    shard.on('shardReconnecting', (id) => this.emit('shardReconnecting', id));
    shard.on('shardConnecting', (id) => this.emit('shardConnecting', id));
  }

  broadcastEval(fn) {
    // Placeholder: In multi-process, this would send code to all shards
    for (const shard of this.shards) {
      fn(shard);
    }
  }

  getShardStatus() {
    return this.shards.map(s => ({ id: s.shardId, status: s.status }));
  }
}

module.exports = ShardingManager; 