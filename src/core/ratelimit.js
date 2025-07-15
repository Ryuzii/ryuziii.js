// Simple REST rate limiter
class RateLimiter {
  constructor(limit = 5, interval = 1000) {
    this.limit = limit;
    this.interval = interval;
    this.queue = [];
    this.active = 0;
    setInterval(() => this.processQueue(), this.interval);
  }

  processQueue() {
    while (this.active < this.limit && this.queue.length) {
      const fn = this.queue.shift();
      this.active++;
      fn(() => this.active--);
    }
  }

  enqueue(fn) {
    this.queue.push(fn);
  }
}

module.exports = RateLimiter; 