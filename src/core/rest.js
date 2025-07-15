// Handles Discord REST API requests
const fetch = require('node-fetch');

class RestClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://discord.com/api/v10';
  }

  async request(method, endpoint, body) {
    const res = await fetch(this.baseUrl + endpoint, {
      method,
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 204) return null; // No Content
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}

module.exports = RestClient; 