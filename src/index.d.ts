// Type definitions for ryuziii.js

import * as core from './core';
import * as sharding from './sharding';
import * as voice from './voice';
import * as cache from './cache';

export interface RyuziiClientOptions {
  token?: string;
  intents?: number;
  cacheOptions?: any;
}

export class RyuziiClient extends core.EventEmitter {
  constructor(options?: RyuziiClientOptions);
  token: string;
  intents: number;
  gateway: core.Gateway;
  cache: cache.CacheManager;
  login(token?: string): void;
}

declare const ryuziii: typeof RyuziiClient & {
  Client: typeof RyuziiClient;
} & typeof core & typeof sharding & typeof voice & typeof cache;

export = ryuziii; 