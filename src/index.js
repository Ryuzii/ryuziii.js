const Client = require('./Client');
const Shard = require('./sharding/Shard');
const ShardManager = require('./sharding/ShardManager');
const VoiceConnection = require('./voice/VoiceConnection');
const Collection = require('./utils/Collection');
const Constants = require('./utils/Constants');
const EmbedBuilder = require('./builders/EmbedBuilder');
const MessageBuilder = require('./builders/MessageBuilder');
const SlashCommandBuilder = require('./builders/SlashCommandBuilder');
const ButtonBuilder = require('./builders/ButtonBuilder');
const ActionRowBuilder = require('./builders/ActionRowBuilder');
const { SelectMenuBuilder, SelectMenuOptionBuilder } = require('./builders/SelectMenuBuilder');
const { ModalBuilder, TextInputBuilder } = require('./builders/ModalBuilder');
const { InteractionManager } = require('./managers/InteractionManager');
const Message = require('./structures/Message');

module.exports = {
  Client,
  Shard,
  ShardManager,
  VoiceConnection,
  Collection,
  Constants,
  EmbedBuilder,
  MessageBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  InteractionManager,
  Message,
  version: require('../package.json').version
};
