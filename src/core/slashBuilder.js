class SlashCommandBuilder {
  constructor() {
    this.command = {
      name: '',
      description: '',
      options: [],
      type: 1 // CHAT_INPUT
    };
  }
  setName(name) {
    this.command.name = name;
    return this;
  }
  setDescription(description) {
    this.command.description = description;
    return this;
  }
  addOption(option) {
    this.command.options.push(option);
    return this;
  }
  toJSON() {
    return { ...this.command };
  }
}

module.exports = { SlashCommandBuilder }; 