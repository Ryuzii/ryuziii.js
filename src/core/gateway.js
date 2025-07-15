// Handles Discord Gateway (WebSocket) connection
const WebSocket = require('ws');

class Gateway {
  constructor(token, intents = 513) {
    this.token = token;
    this.intents = intents;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    this.ws.on('open', () => {
      this.ws.send(JSON.stringify({
        op: 2,
        d: {
          token: this.token,
          intents: this.intents,
          properties: {
            $os: process.platform,
            $browser: 'ryuziii',
            $device: 'ryuziii'
          }
        }
      }));
    });
    this.ws.on('message', (data) => {
      const payload = JSON.parse(data);
      // Handle events here or emit them
      if (this.onEvent) this.onEvent(payload);
    });
    this.ws.on('close', () => {
      // Handle reconnect logic here
    });
    this.ws.on('error', (err) => {
      // Handle error
    });
  }
}

module.exports = Gateway; 