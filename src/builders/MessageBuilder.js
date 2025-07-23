const EmbedBuilder = require('./EmbedBuilder');

class MessageBuilder {
  constructor(data = {}) {
    this.data = {
      content: data.content || null,
      embeds: data.embeds || [],
      components: data.components || [],
      files: data.files || [],
      flags: data.flags || null,
      tts: data.tts || false,
      allowed_mentions: data.allowed_mentions || null
    };
  }

  setContent(content) {
    if (content && content.length > 2000) {
      throw new Error('Message content cannot exceed 2000 characters');
    }
    this.data.content = content;
    return this;
  }

  addEmbed(embed) {
    if (this.data.embeds.length >= 10) {
      throw new Error('Messages cannot have more than 10 embeds');
    }
    
    if (embed instanceof EmbedBuilder) {
      embed.validate();
      this.data.embeds.push(embed.toJSON());
    } else {
      this.data.embeds.push(embed);
    }
    return this;
  }

  setEmbeds(...embeds) {
    this.data.embeds = [];
    for (const embed of embeds) {
      this.addEmbed(embed);
    }
    return this;
  }

  addComponent(component) {
    if (this.data.components.length >= 5) {
      throw new Error('Messages cannot have more than 5 action rows');
    }
    this.data.components.push(component);
    return this;
  }

  setComponents(...components) {
    this.data.components = components;
    return this;
  }

  addFile(file) {
    this.data.files.push(file);
    return this;
  }

  setFiles(...files) {
    this.data.files = files;
    return this;
  }

  setTTS(tts = true) {
    this.data.tts = Boolean(tts);
    return this;
  }

  setFlags(flags) {
    this.data.flags = flags;
    return this;
  }

  setAllowedMentions(allowedMentions) {
    this.data.allowed_mentions = allowedMentions;
    return this;
  }

  suppressEmbeds() {
    this.data.flags = (this.data.flags || 0) | (1 << 2); // SUPPRESS_EMBEDS
    return this;
  }

  suppressNotifications() {
    this.data.flags = (this.data.flags || 0) | (1 << 12); // SUPPRESS_NOTIFICATIONS
    return this;
  }

  // Quick methods for common message types
  static success(content, description = null) {
    const message = new MessageBuilder();
    if (description) {
      message.addEmbed(EmbedBuilder.success(content, description));
    } else {
      message.setContent(`✅ ${content}`);
    }
    return message;
  }

  static error(content, description = null) {
    const message = new MessageBuilder();
    if (description) {
      message.addEmbed(EmbedBuilder.error(content, description));
    } else {
      message.setContent(`❌ ${content}`);
    }
    return message;
  }

  static warning(content, description = null) {
    const message = new MessageBuilder();
    if (description) {
      message.addEmbed(EmbedBuilder.warning(content, description));
    } else {
      message.setContent(`⚠️ ${content}`);
    }
    return message;
  }

  static info(content, description = null) {
    const message = new MessageBuilder();
    if (description) {
      message.addEmbed(EmbedBuilder.info(content, description));
    } else {
      message.setContent(`ℹ️ ${content}`);
    }
    return message;
  }

  static loading(content = 'Loading...', description = null) {
    const message = new MessageBuilder();
    if (description) {
      message.addEmbed(EmbedBuilder.loading(content, description));
    } else {
      message.setContent(`🔄 ${content}`);
    }
    return message;
  }

  toJSON() {
    // Clean up null/empty values
    const cleaned = {};
    
    for (const [key, value] of Object.entries(this.data)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            cleaned[key] = value;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  validate() {
    if (this.data.content && this.data.content.length > 2000) {
      throw new Error('Message content cannot exceed 2000 characters');
    }
    
    if (this.data.embeds.length > 10) {
      throw new Error('Messages cannot have more than 10 embeds');
    }
    
    if (this.data.components.length > 5) {
      throw new Error('Messages cannot have more than 5 action rows');
    }
    
    // Validate that message has content
    if (!this.data.content && 
        (!this.data.embeds || this.data.embeds.length === 0) && 
        (!this.data.files || this.data.files.length === 0) &&
        (!this.data.components || this.data.components.length === 0)) {
      throw new Error('Message must have content, embeds, files, or components');
    }
    
    return true;
  }
}

module.exports = MessageBuilder;
