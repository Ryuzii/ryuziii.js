const EventEmitter = require('./events');

// Maps and emits gateway events
class EventDispatcher extends EventEmitter {
  handleGatewayEvent(payload) {
    if (payload.t) {
      this.emit(payload.t, payload.d);
      // Special handling for voice state events
      if (payload.t === 'VOICE_STATE_UPDATE') {
        this.emit('voiceStateUpdate', payload.d);
      }
      if (payload.t === 'VOICE_SERVER_UPDATE') {
        this.emit('voiceServerUpdate', payload.d);
      }
    }
    this.emit('RAW', payload);
  }
}

module.exports = EventDispatcher; 