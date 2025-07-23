class SlashCommandBuilder {
  constructor() {
    this.data = {
      name: null,
      description: null,
      options: [],
      default_member_permissions: null,
      dm_permission: true,
      type: 1 // CHAT_INPUT
    };
  }

  setName(name) {
    if (typeof name !== 'string') {
      throw new Error('Command name must be a string');
    }
    if (name.length < 1 || name.length > 32) {
      throw new Error('Command name must be between 1 and 32 characters');
    }
    if (!/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Command name must only contain lowercase letters, numbers, and hyphens');
    }
    
    this.data.name = name.toLowerCase();
    return this;
  }

  setDescription(description) {
    if (typeof description !== 'string') {
      throw new Error('Command description must be a string');
    }
    if (description.length < 1 || description.length > 100) {
      throw new Error('Command description must be between 1 and 100 characters');
    }
    
    this.data.description = description;
    return this;
  }

  setDefaultMemberPermissions(permissions) {
    this.data.default_member_permissions = permissions;
    return this;
  }

  setDMPermission(enabled) {
    this.data.dm_permission = Boolean(enabled);
    return this;
  }

  addStringOption(callback) {
    const option = new SlashCommandStringOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addIntegerOption(callback) {
    const option = new SlashCommandIntegerOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addNumberOption(callback) {
    const option = new SlashCommandNumberOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addBooleanOption(callback) {
    const option = new SlashCommandBooleanOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addUserOption(callback) {
    const option = new SlashCommandUserOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addChannelOption(callback) {
    const option = new SlashCommandChannelOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addRoleOption(callback) {
    const option = new SlashCommandRoleOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addMentionableOption(callback) {
    const option = new SlashCommandMentionableOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addAttachmentOption(callback) {
    const option = new SlashCommandAttachmentOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addSubcommand(callback) {
    const option = new SlashCommandSubcommandOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addSubcommandGroup(callback) {
    const option = new SlashCommandSubcommandGroupOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  toJSON() {
    if (!this.data.name) {
      throw new Error('Command name is required');
    }
    if (!this.data.description) {
      throw new Error('Command description is required');
    }
    
    return { ...this.data };
  }
}

// Base option class
class SlashCommandOption {
  constructor(type) {
    this.data = {
      type: type,
      name: null,
      description: null,
      required: false
    };
  }

  setName(name) {
    if (typeof name !== 'string') {
      throw new Error('Option name must be a string');
    }
    if (name.length < 1 || name.length > 32) {
      throw new Error('Option name must be between 1 and 32 characters');
    }
    if (!/^[\w-]{1,32}$/.test(name)) {
      throw new Error('Option name must only contain lowercase letters, numbers, and hyphens');
    }
    
    this.data.name = name.toLowerCase();
    return this;
  }

  setDescription(description) {
    if (typeof description !== 'string') {
      throw new Error('Option description must be a string');
    }
    if (description.length < 1 || description.length > 100) {
      throw new Error('Option description must be between 1 and 100 characters');
    }
    
    this.data.description = description;
    return this;
  }

  setRequired(required = true) {
    this.data.required = Boolean(required);
    return this;
  }

  toJSON() {
    if (!this.data.name) {
      throw new Error('Option name is required');
    }
    if (!this.data.description) {
      throw new Error('Option description is required');
    }
    
    return { ...this.data };
  }
}

// String option
class SlashCommandStringOption extends SlashCommandOption {
  constructor() {
    super(3); // STRING
  }

  setMinLength(minLength) {
    this.data.min_length = minLength;
    return this;
  }

  setMaxLength(maxLength) {
    this.data.max_length = maxLength;
    return this;
  }

  addChoices(...choices) {
    if (!this.data.choices) this.data.choices = [];
    
    for (const choice of choices) {
      if (typeof choice === 'string') {
        this.data.choices.push({ name: choice, value: choice });
      } else {
        this.data.choices.push(choice);
      }
    }
    
    if (this.data.choices.length > 25) {
      throw new Error('Cannot have more than 25 choices');
    }
    
    return this;
  }

  setAutocomplete(autocomplete = true) {
    this.data.autocomplete = Boolean(autocomplete);
    return this;
  }
}

// Integer option
class SlashCommandIntegerOption extends SlashCommandOption {
  constructor() {
    super(4); // INTEGER
  }

  setMinValue(minValue) {
    this.data.min_value = minValue;
    return this;
  }

  setMaxValue(maxValue) {
    this.data.max_value = maxValue;
    return this;
  }

  addChoices(...choices) {
    if (!this.data.choices) this.data.choices = [];
    
    for (const choice of choices) {
      if (typeof choice === 'number') {
        this.data.choices.push({ name: choice.toString(), value: choice });
      } else {
        this.data.choices.push(choice);
      }
    }
    
    if (this.data.choices.length > 25) {
      throw new Error('Cannot have more than 25 choices');
    }
    
    return this;
  }

  setAutocomplete(autocomplete = true) {
    this.data.autocomplete = Boolean(autocomplete);
    return this;
  }
}

// Number option
class SlashCommandNumberOption extends SlashCommandOption {
  constructor() {
    super(10); // NUMBER
  }

  setMinValue(minValue) {
    this.data.min_value = minValue;
    return this;
  }

  setMaxValue(maxValue) {
    this.data.max_value = maxValue;
    return this;
  }

  addChoices(...choices) {
    if (!this.data.choices) this.data.choices = [];
    
    for (const choice of choices) {
      if (typeof choice === 'number') {
        this.data.choices.push({ name: choice.toString(), value: choice });
      } else {
        this.data.choices.push(choice);
      }
    }
    
    if (this.data.choices.length > 25) {
      throw new Error('Cannot have more than 25 choices');
    }
    
    return this;
  }

  setAutocomplete(autocomplete = true) {
    this.data.autocomplete = Boolean(autocomplete);
    return this;
  }
}

// Boolean option
class SlashCommandBooleanOption extends SlashCommandOption {
  constructor() {
    super(5); // BOOLEAN
  }
}

// User option
class SlashCommandUserOption extends SlashCommandOption {
  constructor() {
    super(6); // USER
  }
}

// Channel option
class SlashCommandChannelOption extends SlashCommandOption {
  constructor() {
    super(7); // CHANNEL
  }

  addChannelTypes(...types) {
    this.data.channel_types = types;
    return this;
  }
}

// Role option
class SlashCommandRoleOption extends SlashCommandOption {
  constructor() {
    super(8); // ROLE
  }
}

// Mentionable option
class SlashCommandMentionableOption extends SlashCommandOption {
  constructor() {
    super(9); // MENTIONABLE
  }
}

// Attachment option
class SlashCommandAttachmentOption extends SlashCommandOption {
  constructor() {
    super(11); // ATTACHMENT
  }
}

// Subcommand option
class SlashCommandSubcommandOption extends SlashCommandOption {
  constructor() {
    super(1); // SUB_COMMAND
    this.data.options = [];
  }

  addStringOption(callback) {
    const option = new SlashCommandStringOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addIntegerOption(callback) {
    const option = new SlashCommandIntegerOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addNumberOption(callback) {
    const option = new SlashCommandNumberOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addBooleanOption(callback) {
    const option = new SlashCommandBooleanOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addUserOption(callback) {
    const option = new SlashCommandUserOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addChannelOption(callback) {
    const option = new SlashCommandChannelOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addRoleOption(callback) {
    const option = new SlashCommandRoleOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addMentionableOption(callback) {
    const option = new SlashCommandMentionableOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }

  addAttachmentOption(callback) {
    const option = new SlashCommandAttachmentOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }
}

// Subcommand group option
class SlashCommandSubcommandGroupOption extends SlashCommandOption {
  constructor() {
    super(2); // SUB_COMMAND_GROUP
    this.data.options = [];
  }

  addSubcommand(callback) {
    const option = new SlashCommandSubcommandOption();
    callback(option);
    this.data.options.push(option.toJSON());
    return this;
  }
}

// Channel types enum
SlashCommandBuilder.ChannelTypes = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_ANNOUNCEMENT: 5,
  ANNOUNCEMENT_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15
};

module.exports = SlashCommandBuilder;
