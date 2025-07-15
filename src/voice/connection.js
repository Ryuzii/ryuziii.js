// VoiceConnection using @discordjs/voice
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');

class VoiceConnection {
  constructor(client, guildId, channelId) {
    this.client = client;
    this.guildId = guildId;
    this.channelId = channelId;
    this.connection = null;
    this.status = 'disconnected';
  }

  join() {
    this.connection = joinVoiceChannel({
      channelId: this.channelId,
      guildId: this.guildId,
      adapterCreator: this.client.guilds.cache.get(this.guildId).voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });
    this.status = 'connecting';
    this.connection.on(VoiceConnectionStatus.Ready, () => {
      this.status = 'connected';
    });
    this.connection.on(VoiceConnectionStatus.Disconnected, () => {
      this.status = 'disconnected';
    });
  }

  leave() {
    const conn = getVoiceConnection(this.guildId);
    if (conn) conn.destroy();
    this.status = 'disconnected';
  }
}

module.exports = VoiceConnection; 