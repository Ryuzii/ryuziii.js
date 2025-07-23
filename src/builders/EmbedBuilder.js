class EmbedBuilder {
  constructor(data = {}) {
    this.data = {
      title: data.title || null,
      description: data.description || null,
      url: data.url || null,
      timestamp: data.timestamp || null,
      color: data.color || null,
      footer: data.footer || null,
      image: data.image || null,
      thumbnail: data.thumbnail || null,
      author: data.author || null,
      fields: data.fields || []
    };
  }

  setTitle(title) {
    this.data.title = title;
    return this;
  }

  setDescription(description) {
    this.data.description = description;
    return this;
  }

  setURL(url) {
    this.data.url = url;
    return this;
  }

  setTimestamp(timestamp = new Date()) {
    this.data.timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
    return this;
  }

  setColor(color) {
    if (typeof color === 'string') {
      // Handle hex colors
      if (color.startsWith('#')) {
        this.data.color = parseInt(color.slice(1), 16);
      } else {
        // Handle color names
        const colors = {
          red: 0xff0000,
          green: 0x00ff00,
          blue: 0x0000ff,
          yellow: 0xffff00,
          orange: 0xffa500,
          purple: 0x800080,
          pink: 0xffc0cb,
          cyan: 0x00ffff,
          magenta: 0xff00ff,
          white: 0xffffff,
          black: 0x000000,
          gray: 0x808080,
          grey: 0x808080,
          discord: 0x5865f2,
          blurple: 0x5865f2,
          success: 0x00ff00,
          warning: 0xffa500,
          error: 0xff0000,
          info: 0x3498db
        };
        this.data.color = colors[color.toLowerCase()] || 0x000000;
      }
    } else {
      this.data.color = color;
    }
    return this;
  }

  setFooter(text, iconURL = null) {
    this.data.footer = {
      text: text,
      icon_url: iconURL
    };
    return this;
  }

  setImage(url) {
    this.data.image = { url: url };
    return this;
  }

  setThumbnail(url) {
    this.data.thumbnail = { url: url };
    return this;
  }

  setAuthor(name, iconURL = null, url = null) {
    this.data.author = {
      name: name,
      icon_url: iconURL,
      url: url
    };
    return this;
  }

  addField(name, value, inline = false) {
    if (this.data.fields.length >= 25) {
      throw new Error('Embeds cannot have more than 25 fields');
    }
    
    this.data.fields.push({
      name: name,
      value: value,
      inline: inline
    });
    return this;
  }

  addFields(...fields) {
    for (const field of fields) {
      this.addField(field.name, field.value, field.inline);
    }
    return this;
  }

  setFields(...fields) {
    this.data.fields = [];
    return this.addFields(...fields);
  }

  spliceFields(index, deleteCount, ...fields) {
    this.data.fields.splice(index, deleteCount, ...fields);
    return this;
  }

  // Static color methods
  static Colors = {
    RED: 0xff0000,
    GREEN: 0x00ff00,
    BLUE: 0x0000ff,
    YELLOW: 0xffff00,
    ORANGE: 0xffa500,
    PURPLE: 0x800080,
    PINK: 0xffc0cb,
    CYAN: 0x00ffff,
    MAGENTA: 0xff00ff,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    GRAY: 0x808080,
    GREY: 0x808080,
    DISCORD: 0x5865f2,
    BLURPLE: 0x5865f2,
    SUCCESS: 0x00ff00,
    WARNING: 0xffa500,
    ERROR: 0xff0000,
    INFO: 0x3498db,
    PRIMARY: 0x007bff,
    SECONDARY: 0x6c757d,
    LIGHT: 0xf8f9fa,
    DARK: 0x343a40
  };

  // Preset embed types
  static success(title, description) {
    return new EmbedBuilder()
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setColor(EmbedBuilder.Colors.SUCCESS);
  }

  static error(title, description) {
    return new EmbedBuilder()
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setColor(EmbedBuilder.Colors.ERROR);
  }

  static warning(title, description) {
    return new EmbedBuilder()
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setColor(EmbedBuilder.Colors.WARNING);
  }

  static info(title, description) {
    return new EmbedBuilder()
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setColor(EmbedBuilder.Colors.INFO);
  }

  static loading(title = 'Loading...', description = 'Please wait...') {
    return new EmbedBuilder()
      .setTitle(`🔄 ${title}`)
      .setDescription(description)
      .setColor(EmbedBuilder.Colors.DISCORD);
  }

  toJSON() {
    // Clean up null values
    const cleaned = {};
    for (const [key, value] of Object.entries(this.data)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length === 0) continue;
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  // Validation
  validate() {
    const data = this.toJSON();
    
    if (data.title && data.title.length > 256) {
      throw new Error('Embed title cannot exceed 256 characters');
    }
    
    if (data.description && data.description.length > 4096) {
      throw new Error('Embed description cannot exceed 4096 characters');
    }
    
    if (data.fields) {
      if (data.fields.length > 25) {
        throw new Error('Embeds cannot have more than 25 fields');
      }
      
      for (const field of data.fields) {
        if (field.name && field.name.length > 256) {
          throw new Error('Field name cannot exceed 256 characters');
        }
        if (field.value && field.value.length > 1024) {
          throw new Error('Field value cannot exceed 1024 characters');
        }
      }
    }
    
    if (data.footer && data.footer.text && data.footer.text.length > 2048) {
      throw new Error('Footer text cannot exceed 2048 characters');
    }
    
    if (data.author && data.author.name && data.author.name.length > 256) {
      throw new Error('Author name cannot exceed 256 characters');
    }
    
    // Calculate total character count
    let totalLength = 0;
    if (data.title) totalLength += data.title.length;
    if (data.description) totalLength += data.description.length;
    if (data.footer && data.footer.text) totalLength += data.footer.text.length;
    if (data.author && data.author.name) totalLength += data.author.name.length;
    if (data.fields) {
      for (const field of data.fields) {
        if (field.name) totalLength += field.name.length;
        if (field.value) totalLength += field.value.length;
      }
    }
    
    if (totalLength > 6000) {
      throw new Error('Total embed character count cannot exceed 6000 characters');
    }
    
    return true;
  }
}

module.exports = EmbedBuilder;
