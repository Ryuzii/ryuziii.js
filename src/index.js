// ryuziii.js main entry point

const RyuziiClient = require('./client');
const { Intents, resolveIntents } = require('./core/intents');
const { SlashCommandBuilder } = require('./core/slashBuilder');
const { loadSlashCommands } = require('./core/utils');

module.exports = Object.assign(RyuziiClient, {
  Client: RyuziiClient,
  Intents,
  resolveIntents,
  SlashCommandBuilder,
  loadSlashCommands,
  ...require('./core'),
  ...require('./sharding'),
  ...require('./voice'),
  ...require('./cache')
}); 