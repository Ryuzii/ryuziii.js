const EventEmitter = require('events');

class MemoryManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.maxMemoryUsage = options.maxMemoryUsage || 512 * 1024 * 1024; // 512MB default
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.cleanupThreshold = options.cleanupThreshold || 0.8; // 80%
    
    this.monitoringEnabled = options.monitoring !== false;
    this.autoCleanup = options.autoCleanup !== false;
    
    this.collections = new Set();
    this.cleanupCallbacks = new Set();
    
    if (this.monitoringEnabled) {
      this.startMonitoring();
    }
  }

  registerCollection(collection) {
    this.collections.add(collection);
  }

  unregisterCollection(collection) {
    this.collections.delete(collection);
  }

  registerCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  unregisterCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;
    const usageRatio = heapUsed / this.maxMemoryUsage;

    this.emit('memoryCheck', {
      heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usageRatio,
      maxMemory: this.maxMemoryUsage
    });

    if (usageRatio > this.cleanupThreshold && this.autoCleanup) {
      this.performCleanup();
    }

    if (usageRatio > 0.95) {
      this.emit('memoryWarning', {
        message: 'Memory usage is critically high',
        heapUsed,
        usageRatio
      });
    }
  }

  performCleanup() {
    this.emit('cleanupStart');
    
    let itemsCleared = 0;

    // Clean up collections
    for (const collection of this.collections) {
      if (collection && typeof collection.sweep === 'function') {
        itemsCleared += collection.sweep(() => Math.random() < 0.3); // Remove 30% randomly
      } else if (collection && typeof collection.clear === 'function') {
        const sizeBefore = collection.size || 0;
        collection.clear();
        itemsCleared += sizeBefore;
      }
    }

    // Run custom cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        const result = callback();
        if (typeof result === 'number') {
          itemsCleared += result;
        }
      } catch (error) {
        this.emit('error', error);
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    this.emit('cleanupComplete', { itemsCleared });
  }

  forceCleanup() {
    this.performCleanup();
  }

  getMemoryStats() {
    const memUsage = process.memoryUsage();
    return {
      ...memUsage,
      usageRatio: memUsage.heapUsed / this.maxMemoryUsage,
      maxMemory: this.maxMemoryUsage,
      collectionsCount: this.collections.size,
      cleanupCallbacksCount: this.cleanupCallbacks.size
    };
  }

  setMaxMemory(maxMemory) {
    this.maxMemoryUsage = maxMemory;
  }

  destroy() {
    this.stopMonitoring();
    this.collections.clear();
    this.cleanupCallbacks.clear();
    this.removeAllListeners();
  }
}

module.exports = MemoryManager;
