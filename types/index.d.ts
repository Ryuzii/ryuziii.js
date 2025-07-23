import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

declare module 'ryuziii.js' {
  export interface ClientOptions {
    intents?: number;
    largeThreshold?: number;
    maxCacheSize?: number;
    messageCacheSize?: number;
    maxMemoryUsage?: number;
    memoryMonitoring?: boolean;
    autoCleanup?: boolean;
    restRequestTimeout?: number;
    retryLimit?: number;
    shard?: [number, number];
  }

  export interface ShardManagerOptions {
    totalShards?: number | 'auto';
    shardList?: number[] | 'auto';
    mode?: 'process' | 'worker';
    respawn?: boolean;
    shardArgs?: string[];
    execArgv?: string[];
    token?: string;
    spawnTimeout?: number;
    spawnDelay?: number;
  }

  export interface VoiceConnectionOptions {
    selfDeaf?: boolean;
    selfMute?: boolean;
  }

  export class Collection<K = string, V = any> extends Map<K, V> {
    constructor(entries?: ReadonlyArray<readonly [K, V]> | null);
    setMaxSize(maxSize: number): this;
    array(): V[];
    keyArray(): K[];
    first(): V | undefined;
    first(amount: number): V[];
    last(): V | undefined;
    last(amount: number): V[];
    random(): V | undefined;
    random(amount: number): V[];
    find(fn: (value: V, key: K, collection: this) => boolean, thisArg?: any): V | undefined;
    filter(fn: (value: V, key: K, collection: this) => boolean, thisArg?: any): Collection<K, V>;
    sweep(fn: (value: V, key: K, collection: this) => boolean, thisArg?: any): number;
    map<T>(fn: (value: V, key: K, collection: this) => T, thisArg?: any): T[];
    clone(): Collection<K, V>;
    concat(...collections: Collection<K, V>[]): Collection<K, V>;
    equals(collection: Collection<K, V>): boolean;
  }

  export class Client extends EventEmitter {
    constructor(options?: ClientOptions);
    
    token: string | null;
    user: any | null;
    options: ClientOptions;
    guilds: Collection<string, any>;
    channels: Collection<string, any>;
    users: Collection<string, any>;
    voiceStates: Collection<string, any>;
    messageCache: any;
    memoryManager: any;
    readyAt: Date | null;

    login(token: string): Promise<void>;
    destroy(): void;
    
    readonly uptime: number | null;
    readonly ping: number;

    // Convenience methods
    sendMessage(channelId: string, options: string | any): Promise<any>;
    editMessage(channelId: string, messageId: string, options: string | any): Promise<any>;
    deleteMessage(channelId: string, messageId: string): Promise<any>;
    getMessage(channelId: string, messageId: string): Promise<any>;
    getMessages(channelId: string, options?: any): Promise<any[]>;
    addReaction(channelId: string, messageId: string, emoji: string): Promise<any>;
    removeReaction(channelId: string, messageId: string, emoji: string, userId?: string): Promise<any>;
    getGuild(guildId: string): Promise<any>;
    getChannel(channelId: string): Promise<any>;
    getUser(userId: string): Promise<any>;
    getGuildMember(guildId: string, userId: string): Promise<any>;
    kickMember(guildId: string, userId: string, reason?: string): Promise<any>;
    banMember(guildId: string, userId: string, options?: any): Promise<any>;
    unbanMember(guildId: string, userId: string, reason?: string): Promise<any>;
    createSlashCommand(guildId: string | null, command: any): Promise<any>;
    getSlashCommands(guildId?: string): Promise<any[]>;
    deleteSlashCommand(commandId: string, guildId?: string): Promise<any>;
    setPresence(presence: any): void;
    setStatus(status: string, activity?: any): void;
    setOnline(activity?: any): void;
    setIdle(activity?: any): void;
    setDND(activity?: any): void;
    setInvisible(): void;
    setActivity(name: string, options?: any): void;
    setPlaying(name: string): void;
    setStreaming(name: string, url: string): void;
    setListening(name: string): void;
    setWatching(name: string): void;
    setCompeting(name: string): void;
    setCustomStatus(state: string, emoji?: string): void;
    joinVoiceChannel(guildId: string, channelId: string, options?: any): Promise<void>;
    leaveVoiceChannel(guildId: string): Promise<void>;

    on(event: 'ready', listener: () => void): this;
    on(event: 'messageCreate', listener: (message: any) => void): this;
    on(event: 'messageUpdate', listener: (message: any) => void): this;
    on(event: 'messageDelete', listener: (message: any) => void): this;
    on(event: 'guildCreate', listener: (guild: any) => void): this;
    on(event: 'guildDelete', listener: (guild: any) => void): this;
    on(event: 'channelCreate', listener: (channel: any) => void): this;
    on(event: 'channelDelete', listener: (channel: any) => void): this;
    on(event: 'voiceStateUpdate', listener: (voiceState: any) => void): this;
    on(event: 'voiceServerUpdate', listener: (data: any) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'debug', listener: (message: string) => void): this;
    on(event: 'raw', listener: (data: { event: string; data: any }) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export class Shard extends EventEmitter {
    constructor(manager: ShardManager, id: number);
    
    manager: ShardManager;
    id: number;
    process: ChildProcess | null;
    ready: boolean;
    ping: number;
    guildCount: number;
    userCount: number;

    spawn(timeout?: number): Promise<void>;
    kill(): Promise<void>;
    respawn(delay?: number, timeout?: number): Promise<void>;
    send(message: any): Promise<void>;
    eval(script: string, context?: any): Promise<any>;
    fetchClientValue(prop: string): Promise<any>;

    on(event: 'spawn', listener: () => void): this;
    on(event: 'death', listener: (data: { code: number; signal: string }) => void): this;
    on(event: 'ready', listener: () => void): this;
    on(event: 'disconnect', listener: () => void): this;
    on(event: 'reconnecting', listener: () => void): this;
    on(event: 'message', listener: (message: any) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export class ShardManager extends EventEmitter {
    constructor(file: string, options?: ShardManagerOptions);
    
    file: string;
    totalShards: number | 'auto';
    shards: Map<number, Shard>;
    spawning: boolean;

    spawn(amount?: number | 'auto', delay?: number, timeout?: number): Promise<Map<number, Shard>>;
    createShard(id: number): Promise<Shard>;
    respawnShard(id: number): Promise<void>;
    respawnAll(spawnDelay?: number, respawnDelay?: number, timeout?: number): Promise<Map<number, Shard>>;
    broadcast(message: any): Promise<void[]>;
    broadcastEval(script: string, context?: any): Promise<any[]>;
    fetchClientValues(prop: string): Promise<any[] | null>;
    fetchRecommendedShards(): Promise<number>;

    readonly totalGuilds: number;
    readonly totalUsers: number;
    readonly averageLatency: number;

    on(event: 'shardCreate', listener: (shard: Shard) => void): this;
    on(event: 'shardDestroy', listener: (shard: Shard) => void): this;
    on(event: 'shardReady', listener: (shard: Shard) => void): this;
    on(event: 'shardDisconnect', listener: (shard: Shard) => void): this;
    on(event: 'shardReconnecting', listener: (shard: Shard) => void): this;
    on(event: 'shardMessage', listener: (shard: Shard, message: any) => void): this;
    on(event: 'shardError', listener: (shard: Shard, error: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export class VoiceConnection extends EventEmitter {
    constructor(client: Client, guildId: string, channelId: string);
    
    client: Client;
    guildId: string;
    channelId: string;
    ready: boolean;
    connected: boolean;
    speaking: boolean;

    connect(voiceServerData: any, sessionId: string): Promise<void>;
    setSpeaking(speaking?: boolean): void;
    playOpusStream(stream: any): void;
    disconnect(): void;

    on(event: 'ready', listener: () => void): this;
    on(event: 'disconnect', listener: (code?: number, reason?: string) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export namespace Constants {
    export const API: {
      VERSION: number;
      BASE_URL: string;
      CDN: string;
      GATEWAY: string;
    };

    export const GATEWAY: {
      VERSION: number;
      ENCODING: string;
      COMPRESS: string;
    };

    export const OPCODES: {
      DISPATCH: number;
      HEARTBEAT: number;
      IDENTIFY: number;
      PRESENCE_UPDATE: number;
      VOICE_STATE_UPDATE: number;
      RESUME: number;
      RECONNECT: number;
      REQUEST_GUILD_MEMBERS: number;
      INVALID_SESSION: number;
      HELLO: number;
      HEARTBEAT_ACK: number;
    };

    export const VOICE_OPCODES: {
      IDENTIFY: number;
      SELECT_PROTOCOL: number;
      READY: number;
      HEARTBEAT: number;
      SESSION_DESCRIPTION: number;
      SPEAKING: number;
      HEARTBEAT_ACK: number;
      RESUME: number;
      HELLO: number;
      RESUMED: number;
      CLIENT_DISCONNECT: number;
    };

    export const INTENTS: {
      GUILDS: number;
      GUILD_MEMBERS: number;
      GUILD_BANS: number;
      GUILD_EMOJIS_AND_STICKERS: number;
      GUILD_INTEGRATIONS: number;
      GUILD_WEBHOOKS: number;
      GUILD_INVITES: number;
      GUILD_VOICE_STATES: number;
      GUILD_PRESENCES: number;
      GUILD_MESSAGES: number;
      GUILD_MESSAGE_REACTIONS: number;
      GUILD_MESSAGE_TYPING: number;
      DIRECT_MESSAGES: number;
      DIRECT_MESSAGE_REACTIONS: number;
      DIRECT_MESSAGE_TYPING: number;
      MESSAGE_CONTENT: number;
      GUILD_SCHEDULED_EVENTS: number;
      AUTO_MODERATION_CONFIGURATION: number;
      AUTO_MODERATION_EXECUTION: number;
    };
  }

  export class EmbedBuilder {
    constructor(data?: any);
    setTitle(title: string): this;
    setDescription(description: string): this;
    setURL(url: string): this;
    setTimestamp(timestamp?: Date | string): this;
    setColor(color: string | number): this;
    setFooter(text: string, iconURL?: string): this;
    setImage(url: string): this;
    setThumbnail(url: string): this;
    setAuthor(name: string, iconURL?: string, url?: string): this;
    addField(name: string, value: string, inline?: boolean): this;
    addFields(...fields: Array<{ name: string; value: string; inline?: boolean }>): this;
    setFields(...fields: Array<{ name: string; value: string; inline?: boolean }>): this;
    toJSON(): any;
    validate(): boolean;
    
    static Colors: {
      RED: number;
      GREEN: number;
      BLUE: number;
      YELLOW: number;
      ORANGE: number;
      PURPLE: number;
      PINK: number;
      CYAN: number;
      MAGENTA: number;
      WHITE: number;
      BLACK: number;
      GRAY: number;
      GREY: number;
      DISCORD: number;
      BLURPLE: number;
      SUCCESS: number;
      WARNING: number;
      ERROR: number;
      INFO: number;
      PRIMARY: number;
      SECONDARY: number;
      LIGHT: number;
      DARK: number;
    };
    
    static success(title: string, description?: string): EmbedBuilder;
    static error(title: string, description?: string): EmbedBuilder;
    static warning(title: string, description?: string): EmbedBuilder;
    static info(title: string, description?: string): EmbedBuilder;
    static loading(title?: string, description?: string): EmbedBuilder;
  }

  export class MessageBuilder {
    constructor(data?: any);
    setContent(content: string): this;
    addEmbed(embed: EmbedBuilder | any): this;
    setEmbeds(...embeds: Array<EmbedBuilder | any>): this;
    addComponent(component: any): this;
    setComponents(...components: any[]): this;
    addFile(file: any): this;
    setFiles(...files: any[]): this;
    setTTS(tts?: boolean): this;
    setFlags(flags: number): this;
    setAllowedMentions(allowedMentions: any): this;
    suppressEmbeds(): this;
    suppressNotifications(): this;
    toJSON(): any;
    validate(): boolean;
    
    static success(content: string, description?: string): MessageBuilder;
    static error(content: string, description?: string): MessageBuilder;
    static warning(content: string, description?: string): MessageBuilder;
    static info(content: string, description?: string): MessageBuilder;
    static loading(content?: string, description?: string): MessageBuilder;
  }

  export class SlashCommandBuilder {
    constructor();
    setName(name: string): this;
    setDescription(description: string): this;
    setDefaultMemberPermissions(permissions: string): this;
    setDMPermission(enabled: boolean): this;
    addStringOption(callback: (option: any) => void): this;
    addIntegerOption(callback: (option: any) => void): this;
    addNumberOption(callback: (option: any) => void): this;
    addBooleanOption(callback: (option: any) => void): this;
    addUserOption(callback: (option: any) => void): this;
    addChannelOption(callback: (option: any) => void): this;
    addRoleOption(callback: (option: any) => void): this;
    addMentionableOption(callback: (option: any) => void): this;
    addAttachmentOption(callback: (option: any) => void): this;
    addSubcommand(callback: (option: any) => void): this;
    addSubcommandGroup(callback: (option: any) => void): this;
    toJSON(): any;
    
    static ChannelTypes: {
      GUILD_TEXT: number;
      DM: number;
      GUILD_VOICE: number;
      GROUP_DM: number;
      GUILD_CATEGORY: number;
      GUILD_ANNOUNCEMENT: number;
      ANNOUNCEMENT_THREAD: number;
      PUBLIC_THREAD: number;
      PRIVATE_THREAD: number;
      GUILD_STAGE_VOICE: number;
      GUILD_DIRECTORY: number;
      GUILD_FORUM: number;
    };
  }

  export class ButtonBuilder {
    constructor(data?: any);
    setLabel(label: string): this;
    setCustomId(customId: string): this;
    setURL(url: string): this;
    setEmoji(emoji: string | any): this;
    setStyle(style: string | number): this;
    setDisabled(disabled?: boolean): this;
    setPrimary(): this;
    setSecondary(): this;
    setSuccess(): this;
    setDanger(): this;
    setLink(): this;
    toJSON(): any;
  }

  export class ActionRowBuilder {
    constructor(data?: any);
    addComponents(...components: any[]): this;
    setComponents(...components: any[]): this;
    spliceComponents(index: number, deleteCount: number, ...components: any[]): this;
    toJSON(): any;
  }

  export class SelectMenuBuilder {
    constructor(data?: any);
    setCustomId(customId: string): this;
    setPlaceholder(placeholder: string): this;
    setMinValues(minValues: number): this;
    setMaxValues(maxValues: number): this;
    setDisabled(disabled?: boolean): this;
    addOptions(...options: any[]): this;
    setOptions(...options: any[]): this;
    spliceOptions(index: number, deleteCount: number, ...options: any[]): this;
    toJSON(): any;
  }

  export class SelectMenuOptionBuilder {
    constructor(data?: any);
    setLabel(label: string): this;
    setValue(value: string): this;
    setDescription(description: string): this;
    setEmoji(emoji: string | any): this;
    setDefault(isDefault?: boolean): this;
    toJSON(): any;
  }

  export class ModalBuilder {
    constructor(data?: any);
    setTitle(title: string): this;
    setCustomId(customId: string): this;
    addComponents(...components: any[]): this;
    setComponents(...components: any[]): this;
    toJSON(): any;
  }

  export class TextInputBuilder {
    constructor(data?: any);
    setCustomId(customId: string): this;
    setLabel(label: string): this;
    setStyle(style: string | number): this;
    setMinLength(minLength: number): this;
    setMaxLength(maxLength: number): this;
    setPlaceholder(placeholder: string): this;
    setValue(value: string): this;
    setRequired(required?: boolean): this;
    setShort(): this;
    setParagraph(): this;
    toJSON(): any;
  }

  export class Message {
    constructor(client: Client, data: any);
    id: string;
    channel_id: string;
    guild_id?: string;
    author: any;
    content: string;
    timestamp: string;
    edited_timestamp?: string;
    embeds: any[];
    attachments: any[];
    reactions: any[];
    components: any[];
    channel: any;
    
    reply(options: string | any): Promise<any>;
    edit(options: string | any): Promise<any>;
    delete(): Promise<any>;
    react(emoji: string): Promise<any>;
    removeReaction(emoji: string, userId?: string): Promise<any>;
    pin(): Promise<any>;
    unpin(): Promise<any>;
    startThread(options: any): Promise<any>;
    crosspost(): Promise<any>;
    mentions(user: string | any): boolean;
    
    readonly isBot: boolean;
    readonly url: string;
    readonly createdAt: Date;
    readonly editedAt: Date | null;
    readonly edited: boolean;
  }

  export class InteractionManager extends EventEmitter {
    constructor(client: Client);
    addSlashCommand(name: string, handler: (interaction: any) => Promise<void>): this;
    addButton(customId: string, handler: (interaction: any) => Promise<void>): this;
    addModal(customId: string, handler: (interaction: any) => Promise<void>): this;
    addSelectMenu(customId: string, handler: (interaction: any) => Promise<void>): this;
    handleInteraction(interaction: any): Promise<void>;
  }

  export const version: string;
}
