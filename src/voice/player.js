// AudioPlayer using @discordjs/voice
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');

class AudioPlayer {
  constructor() {
    this.player = createAudioPlayer();
    this.status = 'idle';
    this.currentResource = null;
    this.player.on(AudioPlayerStatus.Playing, () => {
      this.status = 'playing';
    });
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.status = 'idle';
    });
  }

  play(input, options = {}) {
    this.currentResource = createAudioResource(input, {
      inputType: options.inputType || StreamType.Arbitrary,
      ...options
    });
    this.player.play(this.currentResource);
    this.status = 'playing';
  }

  pause() {
    this.player.pause();
    this.status = 'paused';
  }

  stop() {
    this.player.stop();
    this.status = 'idle';
  }
}

module.exports = AudioPlayer; 