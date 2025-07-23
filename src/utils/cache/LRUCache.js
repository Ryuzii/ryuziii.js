class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = new Map();
    this.accessCounter = 0;
  }

  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    this.accessOrder.set(key, ++this.accessCounter);
    return this.cache.get(key);
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.accessOrder.set(key, ++this.accessCounter);
      return this;
    }

    if (this.cache.size >= this.maxSize) {
      this._evictLeastRecentlyUsed();
    }

    this.cache.set(key, value);
    this.accessOrder.set(key, ++this.accessCounter);
    return this;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
    return this;
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    return this;
  }

  _evictLeastRecentlyUsed() {
    let lruKey = null;
    let lruAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < lruAccess) {
        lruAccess = access;
        lruKey = key;
      }
    }

    if (lruKey !== null) {
      this.delete(lruKey);
    }
  }

  get size() {
    return this.cache.size;
  }

  keys() {
    return this.cache.keys();
  }

  values() {
    return this.cache.values();
  }

  entries() {
    return this.cache.entries();
  }

  forEach(callback, thisArg) {
    this.cache.forEach(callback, thisArg);
  }

  [Symbol.iterator]() {
    return this.cache[Symbol.iterator]();
  }
}

module.exports = LRUCache;
