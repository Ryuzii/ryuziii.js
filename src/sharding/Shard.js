const EventEmitter = require('events');
const { fork } = require('child_process');
const path = require('path');

class Shard extends EventEmitter {
  constructor(manager, id) {
    super();
    
    this.manager = manager;
    this.id = id;
    this.args = [
      '--shard-id', id.toString(),
      '--shard-count', manager.totalShards.toString(),
      ...manager.shardArgs
    ];
    
    this.process = null;
    this.worker = null;
    this.env = process.env;
    this.ready = false;
    this.ping = -1;
    this.guildCount = 0;
    this.userCount = 0;
    
    this._evals = new Map();
    this._fetches = new Map();
    this._exitListener = this._handleExit.bind(this);
  }

  async spawn(timeout = 30000) {
    if (this.process) {
      throw new Error(`Shard ${this.id} already has a process`);
    }

    this.process = fork(path.resolve(this.manager.file), this.args, {
      env: this.env,
      execArgv: this.manager.execArgv,
      silent: false
    });

    this.process.on('message', this._handleMessage.bind(this));
    this.process.on('exit', this._exitListener);

    this._spawnTimeoutTimer = setTimeout(() => {
      this.kill();
      this.emit('death');
    }, timeout);

    this.emit('spawn');

    return new Promise((resolve, reject) => {
      this.once('ready', resolve);
      this.once('death', reject);
    });
  }

  async kill() {
    if (this.process) {
      this.process.removeListener('exit', this._exitListener);
      this.process.kill('SIGTERM');
      this.process = null;
    }
    
    this._handleExit();
  }

  async respawn(delay = 500, timeout = 30000) {
    await this.kill();
    if (delay > 0) await this.manager.sleep(delay);
    return this.spawn(timeout);
  }

  send(message) {
    return new Promise((resolve, reject) => {
      if (!this.process || this.process.killed) {
        reject(new Error(`Shard ${this.id} has no process`));
        return;
      }

      this.process.send(message, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async eval(script, context = {}) {
    const nonce = Math.random().toString(36);
    const message = {
      op: 'eval',
      d: { script, context, nonce }
    };

    await this.send(message);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._evals.delete(nonce);
        reject(new Error('Eval timeout'));
      }, 10000);

      this._evals.set(nonce, { resolve, reject, timeout });
    });
  }

  fetchClientValue(prop) {
    return this.eval(`this.${prop}`);
  }

  _handleMessage(message) {
    if (!message) return;

    switch (message.op) {
      case 'ready':
        this.ready = true;
        if (this._spawnTimeoutTimer) {
          clearTimeout(this._spawnTimeoutTimer);
          this._spawnTimeoutTimer = null;
        }
        this.emit('ready');
        break;

      case 'shardReady':
        this.guildCount = message.guildCount || 0;
        this.userCount = message.userCount || 0;
        this.emit('shardReady');
        break;

      case 'disconnect':
        this.ready = false;
        this.emit('disconnect');
        break;

      case 'reconnecting':
        this.ready = false;
        this.emit('reconnecting');
        break;

      case 'stats':
        this.ping = message.ping;
        this.guildCount = message.guildCount;
        this.userCount = message.userCount;
        break;

      case 'evalResult':
        this._handleEvalResult(message.d);
        break;

      case 'error':
        this.emit('error', new Error(message.error));
        break;

      default:
        this.emit('message', message);
        break;
    }
  }

  _handleEvalResult({ nonce, result, error }) {
    const evalData = this._evals.get(nonce);
    if (!evalData) return;

    const { resolve, reject, timeout } = evalData;
    clearTimeout(timeout);
    this._evals.delete(nonce);

    if (error) {
      reject(new Error(error));
    } else {
      resolve(result);
    }
  }

  _handleExit(code, signal) {
    this.ready = false;
    this.process = null;

    if (this._spawnTimeoutTimer) {
      clearTimeout(this._spawnTimeoutTimer);
      this._spawnTimeoutTimer = null;
    }

    this.emit('death', { code, signal });
  }
}

module.exports = Shard;
