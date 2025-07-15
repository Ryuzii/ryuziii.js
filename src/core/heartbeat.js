// Handles Discord Gateway heartbeats
class HeartbeatManager {
  constructor(ws, interval, onHeartbeatAck) {
    this.ws = ws;
    this.interval = interval;
    this.heartbeatInterval = null;
    this.onHeartbeatAck = onHeartbeatAck;
    this.lastSequence = null;
  }

  start() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.interval);
  }

  sendHeartbeat() {
    this.ws.send(JSON.stringify({ op: 1, d: this.lastSequence }));
    if (this.onHeartbeatAck) this.onHeartbeatAck();
  }

  stop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }
}

module.exports = HeartbeatManager; 