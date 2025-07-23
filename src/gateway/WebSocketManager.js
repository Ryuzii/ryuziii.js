const WebSocket = require('ws');
const EventEmitter = require('events');
const zlib = require('zlib');
const Constants = require('../utils/Constants');

class WebSocketManager extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    this.ws = null;
    this.sessionId = null;
    this.sequence = null;
    this.heartbeatInterval = null;
    this.lastHeartbeatAck = true;
    this.resumeGatewayUrl = null;
    this.status = 'DISCONNECTED';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(gatewayUrl) {
    try {
      this.status = 'CONNECTING';
      const url = `${gatewayUrl}/?v=${Constants.GATEWAY.VERSION}&encoding=${Constants.GATEWAY.ENCODING}`;
      
      this.ws = new WebSocket(url, { 
        perMessageDeflate: false,
        handshakeTimeout: 30000
      });

      this.ws.on('open', this.onOpen.bind(this));
      this.ws.on('message', this.onMessage.bind(this));
      this.ws.on('close', this.onClose.bind(this));
      this.ws.on('error', this.onError.bind(this));

    } catch (error) {
      this.emit('error', error);
    }
  }

  onOpen() {
    this.status = 'CONNECTED';
    this.reconnectAttempts = 0;
    this.emit('open');
  }

  onMessage(data) {
    let packet;
    
    try {
      // Ensure we have a Buffer to work with
      let buffer;
      if (data instanceof Buffer) {
        buffer = data;
      } else if (typeof data === 'string') {
        // Convert string back to buffer using binary encoding to preserve bytes
        buffer = Buffer.from(data, 'binary');
      } else {
        throw new Error('Invalid data type received');
      }
      
      // Check if data is zlib compressed (starts with 0x78)
      if (buffer.length > 0 && buffer[0] === 0x78) {
        try {
          // Decompress the zlib data
          const decompressed = zlib.inflateSync(buffer);
          data = decompressed.toString('utf8');
        } catch (zlibError) {
          console.error('Failed to decompress zlib data:', zlibError.message);
          return; // Skip this packet
        }
      } else {
        // Not compressed, treat as UTF-8 text
        data = buffer.toString('utf8');
      }
      
      // Parse JSON
      packet = JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse packet:', error.message);
      console.error('Data type:', typeof data);
      console.error('Original data type:', typeof arguments[0]);
      return; // Don't emit error, just skip this packet
    }

    this.handlePacket(packet);
  }

  handlePacket(packet) {
    const { op, d, s, t } = packet;
    
    if (s !== null) this.sequence = s;

    switch (op) {
      case Constants.OPCODES.HELLO:
        this.handleHello(d);
        break;
      case Constants.OPCODES.HEARTBEAT_ACK:
        this.lastHeartbeatAck = true;
        break;
      case Constants.OPCODES.INVALID_SESSION:
        this.handleInvalidSession(d);
        break;
      case Constants.OPCODES.RECONNECT:
        this.reconnect();
        break;
      case Constants.OPCODES.DISPATCH:
        this.handleDispatch(t, d);
        break;
    }
  }

  handleHello(data) {
    this.heartbeatInterval = setInterval(() => {
      if (!this.lastHeartbeatAck) {
        this.reconnect();
        return;
      }
      this.lastHeartbeatAck = false;
      this.send({ op: Constants.OPCODES.HEARTBEAT, d: this.sequence });
    }, data.heartbeat_interval);

    if (this.sessionId && this.resumeGatewayUrl) {
      this.resume();
    } else {
      this.identify();
    }
  }

  handleInvalidSession(canResume) {
    if (canResume) {
      setTimeout(() => this.resume(), 1000 + Math.random() * 4000);
    } else {
      this.sessionId = null;
      this.sequence = null;
      setTimeout(() => this.identify(), 1000 + Math.random() * 4000);
    }
  }

  handleDispatch(event, data) {
    if (event === 'READY') {
      this.sessionId = data.session_id;
      this.resumeGatewayUrl = data.resume_gateway_url;
    }
    
    this.emit('dispatch', { event, data });
  }

  identify() {
    const payload = {
      op: Constants.OPCODES.IDENTIFY,
      d: {
        token: this.client.token,
        intents: this.client.options.intents,
        properties: {
          os: process.platform,
          browser: 'ryuziii.js',
          device: 'ryuziii.js'
        },
        compress: true,
        large_threshold: this.client.options.largeThreshold || 50,
        shard: this.client.options.shard || [0, 1]
      }
    };

    this.send(payload);
  }

  resume() {
    const payload = {
      op: Constants.OPCODES.RESUME,
      d: {
        token: this.client.token,
        session_id: this.sessionId,
        seq: this.sequence
      }
    };

    this.send(payload);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onClose(code, reason) {
    this.status = 'DISCONNECTED';
    this.clearHeartbeat();
    
    if (code === 4004 || code === 4010 || code === 4011 || code === 4012 || code === 4013 || code === 4014) {
      this.emit('error', new Error(`Fatal WebSocket error: ${code} - ${reason}`));
      return;
    }

    this.emit('close', code, reason);
    this.attemptReconnect();
  }

  onError(error) {
    this.emit('error', error);
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 15000);
    
    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  reconnect() {
    this.disconnect();
    const gatewayUrl = this.resumeGatewayUrl || Constants.API.GATEWAY;
    this.connect(gatewayUrl);
  }

  disconnect() {
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close(1000);
      this.ws = null;
    }
  }

  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

module.exports = WebSocketManager;
