// Simple logger with levels and custom logger support
class Logger {
  constructor(options = {}) {
    this.level = options.level || 'warn';
    this.customLogger = options.customLogger || null;
    this.levels = ['debug', 'info', 'warn', 'error'];
  }

  _shouldLog(level) {
    return this.levels.indexOf(level) >= this.levels.indexOf(this.level);
  }

  debug(...args) {
    if (this._shouldLog('debug')) this._log('debug', ...args);
  }
  info(...args) {
    if (this._shouldLog('info')) this._log('info', ...args);
  }
  warn(...args) {
    if (this._shouldLog('warn')) this._log('warn', ...args);
  }
  error(...args) {
    if (this._shouldLog('error')) this._log('error', ...args);
  }

  _log(level, ...args) {
    if (this.customLogger && typeof this.customLogger[level] === 'function') {
      this.customLogger[level](...args);
    } else {
      const prefix = `[ryuziii.js] [${level.toUpperCase()}]`;
      console[level === 'debug' ? 'log' : level](prefix, ...args);
    }
  }
}

module.exports = Logger; 