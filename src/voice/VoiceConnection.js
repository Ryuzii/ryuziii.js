const EventEmitter = require('events');
const { createSocket } = require('dgram');
const WebSocket = require('ws');
const { randomBytes } = require('crypto');
const Constants = require('../utils/Constants');

class VoiceConnection extends EventEmitter {
  constructor(client, guildId, channelId) {
    super();
    
    this.client = client;
    this.guildId = guildId;
    this.channelId = channelId;
    
    this.ws = null;
    this.udp = null;
    this.voiceServerData = null;
    this.sessionId = null;
    this.ssrc = null;
    this.secretKey = null;
    this.endpoint = null;
    this.port = null;
    this.ip = null;
    
    this.speaking = false;
    this.sequence = 0;
    this.timestamp = 0;
    this.heartbeatInterval = null;
    this.lastHeartbeatAck = true;
    
    this.ready = false;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(voiceServerData, sessionId) {
    this.voiceServerData = voiceServerData;
    this.sessionId = sessionId;
    this.endpoint = voiceServerData.endpoint;

    try {
      await this.connectWebSocket();
    } catch (error) {
      this.emit('error', error);
    }
  }

  async connectWebSocket() {
    const url = `wss://${this.endpoint}/?v=4`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.identify();
    });

    this.ws.on('message', (data) => {
      this.handleWebSocketMessage(JSON.parse(data));
    });

    this.ws.on('close', (code, reason) => {
      this.handleWebSocketClose(code, reason);
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });
  }

  identify() {
    const payload = {
      op: Constants.VOICE_OPCODES.IDENTIFY,
      d: {
        server_id: this.guildId,
        user_id: this.client.user.id,
        session_id: this.sessionId,
        token: this.voiceServerData.token
      }
    };

    this.send(payload);
  }

  handleWebSocketMessage(packet) {
    const { op, d } = packet;

    switch (op) {
      case Constants.VOICE_OPCODES.HELLO:
        this.handleHello(d);
        break;
      case Constants.VOICE_OPCODES.READY:
        this.handleReady(d);
        break;
      case Constants.VOICE_OPCODES.SESSION_DESCRIPTION:
        this.handleSessionDescription(d);
        break;
      case Constants.VOICE_OPCODES.HEARTBEAT_ACK:
        this.lastHeartbeatAck = true;
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
      this.send({ op: Constants.VOICE_OPCODES.HEARTBEAT, d: Date.now() });
    }, data.heartbeat_interval);
  }

  async handleReady(data) {
    this.ssrc = data.ssrc;
    this.ip = data.ip;
    this.port = data.port;

    await this.connectUDP();
    await this.performIPDiscovery();
  }

  async connectUDP() {
    this.udp = createSocket('udp4');
    
    this.udp.on('error', (error) => {
      this.emit('error', error);
    });

    this.udp.on('message', (message) => {
      this.handleUDPMessage(message);
    });
  }

  async performIPDiscovery() {
    const packet = Buffer.alloc(74);
    packet.writeUInt16BE(0x1, 0);
    packet.writeUInt16BE(70, 2);
    packet.writeUInt32BE(this.ssrc, 4);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('IP discovery timeout'));
      }, 10000);

      const handler = (message) => {
        if (message.length !== 74) return;
        
        clearTimeout(timeout);
        this.udp.off('message', handler);
        
        const ip = message.slice(8, 72).toString('utf8').replace(/\0/g, '');
        const port = message.readUInt16BE(72);
        
        this.selectProtocol(ip, port);
        resolve();
      };

      this.udp.on('message', handler);
      this.udp.send(packet, this.port, this.ip);
    });
  }

  selectProtocol(ip, port) {
    const payload = {
      op: Constants.VOICE_OPCODES.SELECT_PROTOCOL,
      d: {
        protocol: 'udp',
        data: {
          address: ip,
          port: port,
          mode: 'xsalsa20_poly1305'
        }
      }
    };

    this.send(payload);
  }

  handleSessionDescription(data) {
    this.secretKey = Buffer.from(data.secret_key);
    this.ready = true;
    this.connected = true;
    this.emit('ready');
  }

  setSpeaking(speaking = true) {
    if (this.speaking === speaking) return;
    
    this.speaking = speaking;
    const payload = {
      op: Constants.VOICE_OPCODES.SPEAKING,
      d: {
        speaking: speaking ? 1 : 0,
        delay: 0,
        ssrc: this.ssrc
      }
    };

    this.send(payload);
  }

  playOpusStream(stream) {
    if (!this.ready) {
      throw new Error('Voice connection not ready');
    }

    this.setSpeaking(true);

    stream.on('data', (chunk) => {
      this.sendAudioPacket(chunk);
    });

    stream.on('end', () => {
      this.setSpeaking(false);
    });

    stream.on('error', (error) => {
      this.emit('error', error);
      this.setSpeaking(false);
    });
  }

  sendAudioPacket(opusData) {
    if (!this.ready || !this.udp) return;

    const header = Buffer.alloc(12);
    header[0] = 0x80;
    header[1] = 0x78;
    header.writeUInt16BE(this.sequence, 2);
    header.writeUInt32BE(this.timestamp, 4);
    header.writeUInt32BE(this.ssrc, 8);

    const nonce = Buffer.alloc(24);
    header.copy(nonce, 0, 0, 12);

    const encrypted = this.encrypt(opusData, nonce);
    const packet = Buffer.concat([header, encrypted]);

    this.udp.send(packet, this.port, this.ip);

    this.sequence = (this.sequence + 1) % 65536;
    this.timestamp = (this.timestamp + 960) % 4294967296;
  }

  encrypt(buffer, nonce) {
    try {
      const sodium = require('sodium-native');
      const output = Buffer.alloc(buffer.length + sodium.crypto_secretbox_MACBYTES);
      sodium.crypto_secretbox_easy(output, buffer, nonce, this.secretKey);
      return output;
    } catch (sodiumError) {
      try {
        const nacl = require('tweetnacl');
        const encrypted = nacl.secretbox(buffer, nonce.slice(0, 24), this.secretKey);
        return Buffer.from(encrypted);
      } catch (naclError) {
        throw new Error('No encryption library available');
      }
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleWebSocketClose(code, reason) {
    this.connected = false;
    this.ready = false;
    this.clearHeartbeat();
    
    this.emit('disconnect', code, reason);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 15000);
    
    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  reconnect() {
    this.disconnect();
    this.connect(this.voiceServerData, this.sessionId);
  }

  disconnect() {
    this.ready = false;
    this.connected = false;
    this.clearHeartbeat();

    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }

    if (this.udp) {
      this.udp.removeAllListeners();
      this.udp.close();
      this.udp = null;
    }

    this.emit('disconnect');
  }

  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleUDPMessage(message) {
    // Handle incoming UDP packets if needed
  }
}

module.exports = VoiceConnection;
