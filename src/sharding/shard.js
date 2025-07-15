const { Gateway } = require('../core');
const EventDispatcher = require('../core/dispatcher');

class Shard extends EventDispatcher {
  constructor(token, shardId, shardCount, intents) {
    super();
    this.token = token;
    this.shardId = shardId;
    this.shardCount = shardCount;
    this.intents = intents;
    this.gateway = null;
    this.status = 'idle'; // idle, connecting, ready, disconnected, reconnecting
  }

  connect() {
    this.status = 'connecting';
    this.gateway = new Gateway(this.token, this.intents);
    this.gateway.onEvent = (payload) => this.handleGatewayEvent(payload);
    this.gateway.connect();
    this.emit('shardConnecting', this.shardId);
  }

  handleGatewayEvent(payload) {
    if (payload.t === 'READY') {
      this.status = 'ready';
      this.emit('shardReady', this.shardId);
    }
    if (payload.op === 9) { // Invalid session
      this.status = 'reconnecting';
      this.emit('shardReconnecting', this.shardId);
      this.restart();
    }
    if (payload.op === 7) { // Reconnect
      this.status = 'reconnecting';
      this.emit('shardReconnecting', this.shardId);
      this.restart();
    }
    this.handleGatewayEvent(payload); // from EventDispatcher
  }

  restart() {
    this.destroy();
    setTimeout(() => this.connect(), 5000);
  }

  destroy() {
    this.status = 'disconnected';
    if (this.gateway && this.gateway.ws) this.gateway.ws.close();
    this.emit('shardDisconnect', this.shardId);
  }
}

module.exports = Shard; 