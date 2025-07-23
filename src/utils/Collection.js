class Collection extends Map {
  constructor(entries) {
    super(entries);
    this._maxSize = null;
  }

  setMaxSize(maxSize) {
    this._maxSize = maxSize;
    this._enforceMaxSize();
    return this;
  }

  set(key, value) {
    super.set(key, value);
    this._enforceMaxSize();
    return this;
  }

  _enforceMaxSize() {
    if (this._maxSize && this.size > this._maxSize) {
      const keysToDelete = Array.from(this.keys()).slice(0, this.size - this._maxSize);
      for (const key of keysToDelete) {
        this.delete(key);
      }
    }
  }

  array() {
    return Array.from(this.values());
  }

  keyArray() {
    return Array.from(this.keys());
  }

  first(amount) {
    if (typeof amount === 'undefined') return this.values().next().value;
    if (amount < 0) return this.last(amount * -1);
    amount = Math.min(this.size, amount);
    const iter = this.values();
    return Array.from({ length: amount }, () => iter.next().value);
  }

  last(amount) {
    const arr = this.array();
    if (typeof amount === 'undefined') return arr[arr.length - 1];
    if (amount < 0) return this.first(amount * -1);
    if (!amount) return [];
    return arr.slice(-amount);
  }

  random(amount) {
    const arr = this.array();
    if (typeof amount === 'undefined') return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !amount) return [];
    return Array.from({ length: Math.min(amount, arr.length) }, () => 
      arr.splice(Math.floor(Math.random() * arr.length), 1)[0]
    );
  }

  find(fn, thisArg) {
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }

  filter(fn, thisArg) {
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    const results = new this.constructor[Symbol.species]();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  sweep(fn, thisArg) {
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    const previousSize = this.size;
    for (const [key, val] of this) {
      if (fn(val, key, this)) this.delete(key);
    }
    return previousSize - this.size;
  }

  map(fn, thisArg) {
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    const iter = this.entries();
    return Array.from({ length: this.size }, () => {
      const [key, value] = iter.next().value;
      return fn(value, key, this);
    });
  }

  clone() {
    return new this.constructor(this);
  }

  concat(...collections) {
    const newColl = this.clone();
    for (const coll of collections) {
      for (const [key, val] of coll) newColl.set(key, val);
    }
    return newColl;
  }

  equals(collection) {
    if (!collection) return false;
    if (this === collection) return true;
    if (this.size !== collection.size) return false;
    for (const [key, value] of this) {
      if (!collection.has(key) || value !== collection.get(key)) {
        return false;
      }
    }
    return true;
  }
}

module.exports = Collection;
