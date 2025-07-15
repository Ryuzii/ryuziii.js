const EventEmitter = require('../core/events');

// In-memory cache with TTL, size limit, and event hooks
class BaseCache extends EventEmitter {
  constructor(options = {}) {
    super();
    this.store = new Map();
    this.ttl = options.ttl || 0; // ms, 0 = no TTL
    this.maxSize = options.maxSize || 0; // 0 = unlimited
    this.timeouts = new Map();
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    if (this.maxSize && this.store.size >= this.maxSize) {
      // Remove oldest
      const oldest = this.store.keys().next().value;
      this.delete(oldest);
    }
    this.store.set(key, value);
    this.emit('set', key, value);
    if (this.ttl) {
      if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
      this.timeouts.set(key, setTimeout(() => {
        this.delete(key);
        this.emit('expire', key);
      }, this.ttl));
    }
  }

  delete(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    const existed = this.store.delete(key);
    if (existed) this.emit('delete', key);
  }

  clear() {
    for (const key of this.store.keys()) this.delete(key);
  }

  has(key) {
    return this.store.has(key);
  }
}

module.exports = BaseCache; 