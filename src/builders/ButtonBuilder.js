class ButtonBuilder {
  constructor(data = {}) {
    this.data = {
      type: 2, // BUTTON
      style: data.style || 1, // PRIMARY
      label: data.label || null,
      emoji: data.emoji || null,
      custom_id: data.custom_id || null,
      url: data.url || null,
      disabled: data.disabled || false
    };
  }

  setLabel(label) {
    this.data.label = label;
    return this;
  }

  setCustomId(customId) {
    this.data.custom_id = customId;
    this.data.url = null; // Clear URL if setting custom_id
    return this;
  }

  setURL(url) {
    this.data.url = url;
    this.data.custom_id = null; // Clear custom_id if setting URL
    this.data.style = 5; // LINK style
    return this;
  }

  setEmoji(emoji) {
    if (typeof emoji === 'string') {
      // Handle Unicode emoji or custom emoji string
      if (emoji.includes(':')) {
        // Custom emoji format: <:name:id> or <a:name:id>
        const match = emoji.match(/<a?:([^:]+):(\d+)>/);
        if (match) {
          this.data.emoji = {
            name: match[1],
            id: match[2],
            animated: emoji.startsWith('<a:')
          };
        }
      } else {
        // Unicode emoji
        this.data.emoji = { name: emoji };
      }
    } else {
      // Already an emoji object
      this.data.emoji = emoji;
    }
    return this;
  }

  setStyle(style) {
    if (typeof style === 'string') {
      const styles = {
        'primary': 1,
        'secondary': 2,
        'success': 3,
        'danger': 4,
        'link': 5,
        'blurple': 1,
        'grey': 2,
        'gray': 2,
        'green': 3,
        'red': 4,
        'url': 5
      };
      this.data.style = styles[style.toLowerCase()] || 1;
    } else {
      this.data.style = style;
    }
    return this;
  }

  setDisabled(disabled = true) {
    this.data.disabled = Boolean(disabled);
    return this;
  }

  // Style shortcuts
  setPrimary() {
    return this.setStyle(1);
  }

  setSecondary() {
    return this.setStyle(2);
  }

  setSuccess() {
    return this.setStyle(3);
  }

  setDanger() {
    return this.setStyle(4);
  }

  setLink() {
    return this.setStyle(5);
  }

  toJSON() {
    // Validate button
    if (!this.data.label && !this.data.emoji) {
      throw new Error('Button must have either a label or emoji');
    }

    if (this.data.style === 5) { // LINK
      if (!this.data.url) {
        throw new Error('Link buttons must have a URL');
      }
    } else {
      if (!this.data.custom_id) {
        throw new Error('Non-link buttons must have a custom_id');
      }
    }

    // Clean up null values
    const cleaned = {};
    for (const [key, value] of Object.entries(this.data)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}

module.exports = ButtonBuilder;
