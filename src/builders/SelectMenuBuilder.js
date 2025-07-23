class SelectMenuBuilder {
  constructor(data = {}) {
    this.data = {
      type: 3, // SELECT_MENU
      custom_id: data.custom_id || null,
      placeholder: data.placeholder || null,
      min_values: data.min_values || 1,
      max_values: data.max_values || 1,
      options: data.options || [],
      disabled: data.disabled || false
    };
  }

  setCustomId(customId) {
    this.data.custom_id = customId;
    return this;
  }

  setPlaceholder(placeholder) {
    this.data.placeholder = placeholder;
    return this;
  }

  setMinValues(minValues) {
    this.data.min_values = minValues;
    return this;
  }

  setMaxValues(maxValues) {
    this.data.max_values = maxValues;
    return this;
  }

  setDisabled(disabled = true) {
    this.data.disabled = Boolean(disabled);
    return this;
  }

  addOptions(...options) {
    for (const option of options) {
      if (this.data.options.length >= 25) {
        throw new Error('Select menus can only have up to 25 options');
      }
      
      if (typeof option === 'string') {
        this.data.options.push({
          label: option,
          value: option.toLowerCase().replace(/\s+/g, '_')
        });
      } else {
        this.data.options.push(option);
      }
    }
    return this;
  }

  setOptions(...options) {
    this.data.options = [];
    return this.addOptions(...options);
  }

  spliceOptions(index, deleteCount, ...options) {
    this.data.options.splice(index, deleteCount, ...options);
    return this;
  }

  toJSON() {
    if (!this.data.custom_id) {
      throw new Error('Select menu must have a custom_id');
    }

    if (this.data.options.length === 0) {
      throw new Error('Select menu must have at least one option');
    }

    if (this.data.options.length > 25) {
      throw new Error('Select menu cannot have more than 25 options');
    }

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
}

class SelectMenuOptionBuilder {
  constructor(data = {}) {
    this.data = {
      label: data.label || null,
      value: data.value || null,
      description: data.description || null,
      emoji: data.emoji || null,
      default: data.default || false
    };
  }

  setLabel(label) {
    this.data.label = label;
    return this;
  }

  setValue(value) {
    this.data.value = value;
    return this;
  }

  setDescription(description) {
    this.data.description = description;
    return this;
  }

  setEmoji(emoji) {
    if (typeof emoji === 'string') {
      // Handle Unicode emoji or custom emoji string
      if (emoji.includes(':')) {
        // Custom emoji format
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
      this.data.emoji = emoji;
    }
    return this;
  }

  setDefault(isDefault = true) {
    this.data.default = Boolean(isDefault);
    return this;
  }

  toJSON() {
    if (!this.data.label) {
      throw new Error('Select menu option must have a label');
    }
    if (!this.data.value) {
      throw new Error('Select menu option must have a value');
    }

    // Clean up null values
    const cleaned = {};
    for (const [key, value] of Object.entries(this.data)) {
      if (value !== null && value !== undefined && value !== false) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}

module.exports = { SelectMenuBuilder, SelectMenuOptionBuilder };
