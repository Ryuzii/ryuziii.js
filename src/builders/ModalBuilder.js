class ModalBuilder {
  constructor(data = {}) {
    this.data = {
      title: data.title || null,
      custom_id: data.custom_id || null,
      components: data.components || []
    };
  }

  setTitle(title) {
    this.data.title = title;
    return this;
  }

  setCustomId(customId) {
    this.data.custom_id = customId;
    return this;
  }

  addComponents(...components) {
    for (const component of components) {
      if (this.data.components.length >= 5) {
        throw new Error('Modals can only have up to 5 action rows');
      }
      
      if (component.toJSON) {
        this.data.components.push(component.toJSON());
      } else {
        this.data.components.push(component);
      }
    }
    return this;
  }

  setComponents(...components) {
    this.data.components = [];
    return this.addComponents(...components);
  }

  toJSON() {
    if (!this.data.title) {
      throw new Error('Modal must have a title');
    }
    if (!this.data.custom_id) {
      throw new Error('Modal must have a custom_id');
    }
    if (this.data.components.length === 0) {
      throw new Error('Modal must have at least one component');
    }

    return { ...this.data };
  }
}

class TextInputBuilder {
  constructor(data = {}) {
    this.data = {
      type: 4, // TEXT_INPUT
      custom_id: data.custom_id || null,
      style: data.style || 1, // SHORT
      label: data.label || null,
      min_length: data.min_length || null,
      max_length: data.max_length || null,
      required: data.required !== false,
      value: data.value || null,
      placeholder: data.placeholder || null
    };
  }

  setCustomId(customId) {
    this.data.custom_id = customId;
    return this;
  }

  setLabel(label) {
    this.data.label = label;
    return this;
  }

  setStyle(style) {
    if (typeof style === 'string') {
      const styles = {
        'short': 1,
        'paragraph': 2,
        'long': 2
      };
      this.data.style = styles[style.toLowerCase()] || 1;
    } else {
      this.data.style = style;
    }
    return this;
  }

  setMinLength(minLength) {
    this.data.min_length = minLength;
    return this;
  }

  setMaxLength(maxLength) {
    this.data.max_length = maxLength;
    return this;
  }

  setPlaceholder(placeholder) {
    this.data.placeholder = placeholder;
    return this;
  }

  setValue(value) {
    this.data.value = value;
    return this;
  }

  setRequired(required = true) {
    this.data.required = Boolean(required);
    return this;
  }

  // Style shortcuts
  setShort() {
    return this.setStyle(1);
  }

  setParagraph() {
    return this.setStyle(2);
  }

  toJSON() {
    if (!this.data.custom_id) {
      throw new Error('Text input must have a custom_id');
    }
    if (!this.data.label) {
      throw new Error('Text input must have a label');
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

module.exports = { ModalBuilder, TextInputBuilder };
