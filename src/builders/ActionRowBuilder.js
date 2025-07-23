class ActionRowBuilder {
  constructor(data = {}) {
    this.data = {
      type: 1, // ACTION_ROW
      components: data.components || []
    };
  }

  addComponents(...components) {
    for (const component of components) {
      if (this.data.components.length >= 5) {
        throw new Error('Action rows can only have up to 5 components');
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

  spliceComponents(index, deleteCount, ...components) {
    this.data.components.splice(index, deleteCount, ...components.map(c => c.toJSON ? c.toJSON() : c));
    return this;
  }

  toJSON() {
    if (this.data.components.length === 0) {
      throw new Error('Action row must have at least one component');
    }

    if (this.data.components.length > 5) {
      throw new Error('Action row cannot have more than 5 components');
    }

    return { ...this.data };
  }
}

module.exports = ActionRowBuilder;
