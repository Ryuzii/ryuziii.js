const EventEmitter = require('events');

class InteractionManager extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    this.commands = new Map();
    this.buttons = new Map();
    this.modals = new Map();
    this.selectMenus = new Map();
  }

  // Register slash command handler
  addSlashCommand(name, handler) {
    this.commands.set(name, handler);
    return this;
  }

  // Register button handler
  addButton(customId, handler) {
    this.buttons.set(customId, handler);
    return this;
  }

  // Register modal handler
  addModal(customId, handler) {
    this.modals.set(customId, handler);
    return this;
  }

  // Register select menu handler
  addSelectMenu(customId, handler) {
    this.selectMenus.set(customId, handler);
    return this;
  }

  // Handle incoming interaction
  async handleInteraction(interaction) {
    try {
      const wrappedInteraction = new InteractionWrapper(interaction, this.client);

      switch (interaction.type) {
        case 2: // APPLICATION_COMMAND
          await this.handleSlashCommand(wrappedInteraction);
          break;
        case 3: // MESSAGE_COMPONENT
          await this.handleMessageComponent(wrappedInteraction);
          break;
        case 5: // MODAL_SUBMIT
          await this.handleModalSubmit(wrappedInteraction);
          break;
        default:
          this.emit('unknownInteraction', wrappedInteraction);
          break;
      }
    } catch (error) {
      this.emit('interactionError', error, interaction);
    }
  }

  async handleSlashCommand(interaction) {
    const commandName = interaction.data.name;
    const handler = this.commands.get(commandName);

    if (handler) {
      await handler(interaction);
    } else {
      this.emit('unknownCommand', interaction);
    }
  }

  async handleMessageComponent(interaction) {
    const customId = interaction.data.custom_id;
    
    if (interaction.data.component_type === 2) { // Button
      const handler = this.buttons.get(customId);
      if (handler) {
        await handler(interaction);
      } else {
        this.emit('unknownButton', interaction);
      }
    } else if (interaction.data.component_type === 3) { // Select menu
      const handler = this.selectMenus.get(customId);
      if (handler) {
        await handler(interaction);
      } else {
        this.emit('unknownSelectMenu', interaction);
      }
    }
  }

  async handleModalSubmit(interaction) {
    const customId = interaction.data.custom_id;
    const handler = this.modals.get(customId);

    if (handler) {
      await handler(interaction);
    } else {
      this.emit('unknownModal', interaction);
    }
  }
}

class InteractionWrapper {
  constructor(interaction, client) {
    this.client = client;
    this.data = interaction.data; // This should be the component/command data
    this.id = interaction.id;
    this.token = interaction.token;
    this.type = interaction.type;
    this.guild_id = interaction.guild_id;
    this.channel_id = interaction.channel_id;
    this.member = interaction.member;
    this.user = interaction.user || interaction.member?.user;
    this.replied = false;
    this.deferred = false;
    
    // Store the full interaction for debugging
    this._rawInteraction = interaction;
  }

  // Check if interaction is a slash command
  isCommand() {
    return this.type === 2;
  }

  // Check if interaction is a button
  isButton() {
    return this.type === 3 && this.data.component_type === 2;
  }

  // Check if interaction is a select menu
  isSelectMenu() {
    return this.type === 3 && this.data.component_type === 3;
  }

  // Check if interaction is a modal
  isModal() {
    return this.type === 5;
  }

  // Get command options
  getOption(name) {
    if (!this.data.options) return null;
    const option = this.data.options.find(opt => opt.name === name);
    return option ? option.value : null;
  }

  // Get all options as object
  getOptions() {
    if (!this.data.options) return {};
    const options = {};
    for (const option of this.data.options) {
      options[option.name] = option.value;
    }
    return options;
  }

  // Get modal field value
  getFieldValue(customId) {
    if (!this.data.components) return null;
    
    for (const row of this.data.components) {
      for (const component of row.components) {
        if (component.custom_id === customId) {
          return component.value;
        }
      }
    }
    return null;
  }

  // Get select menu values
  getValues() {
    return this.data.values || [];
  }

  // Reply to interaction
  async reply(options) {
    if (this.replied || this.deferred) {
      throw new Error('Interaction has already been replied to or deferred');
    }

    let data;
    if (typeof options === 'string') {
      data = { content: options };
    } else if (options.toJSON) {
      data = options.toJSON();
    } else {
      data = options;
    }

    await this.client.rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: data
    });

    this.replied = true;
    return this;
  }

  // Defer reply
  async defer(ephemeral = false) {
    if (this.replied || this.deferred) {
      throw new Error('Interaction has already been replied to or deferred');
    }

    await this.client.rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: ephemeral ? { flags: 64 } : {}
    });

    this.deferred = true;
    return this;
  }

  // Edit reply
  async editReply(options) {
    if (!this.replied && !this.deferred) {
      throw new Error('Interaction must be replied to or deferred before editing');
    }

    let data;
    if (typeof options === 'string') {
      data = { content: options };
    } else if (options.toJSON) {
      data = options.toJSON();
    } else {
      data = options;
    }

    return this.client.rest.request('PATCH', `/webhooks/${this.client.user.id}/${this.token}/messages/@original`, data);
  }

  // Follow up
  async followUp(options) {
    let data;
    if (typeof options === 'string') {
      data = { content: options };
    } else if (options.toJSON) {
      data = options.toJSON();
    } else {
      data = options;
    }

    return this.client.rest.request('POST', `/webhooks/${this.client.user.id}/${this.token}`, data);
  }

  // Delete reply
  async deleteReply() {
    return this.client.rest.request('DELETE', `/webhooks/${this.client.user.id}/${this.token}/messages/@original`);
  }

  // Show modal
  async showModal(modal) {
    if (this.replied || this.deferred) {
      throw new Error('Cannot show modal after replying or deferring');
    }

    await this.client.rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 9, // MODAL
      data: modal
    });

    return this;
  }

  // Update message (for buttons/select menus)
  async update(options) {
    if (this.replied) {
      throw new Error('Interaction has already been replied to');
    }

    let data;
    if (typeof options === 'string') {
      data = { content: options };
    } else if (options.toJSON) {
      data = options.toJSON();
    } else {
      data = options;
    }

    await this.client.rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 7, // UPDATE_MESSAGE
      data: data
    });

    this.replied = true;
    return this;
  }

  // Defer update (for buttons/select menus)
  async deferUpdate() {
    if (this.replied || this.deferred) {
      throw new Error('Interaction has already been replied to or deferred');
    }

    await this.client.rest.request('POST', `/interactions/${this.id}/${this.token}/callback`, {
      type: 6 // DEFERRED_UPDATE_MESSAGE
    });

    this.deferred = true;
    return this;
  }
}

module.exports = { InteractionManager, InteractionWrapper };
