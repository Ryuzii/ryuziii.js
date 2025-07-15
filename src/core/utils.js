// Utility functions for Discord
const fs = require('fs');
const path = require('path');

module.exports = {
  snowflakeToTimestamp: (id) => Number(BigInt(id) >> 22n) + 1420070400000,
  timestampToSnowflake: (ts) => ((BigInt(ts) - 1420070400000n) << 22n).toString(),
  loadSlashCommands: (dir) => {
    const absPath = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
    return fs.readdirSync(absPath)
      .filter(f => f.endsWith('.js'))
      .map(f => {
        const command = require(path.join(absPath, f));
        if (command.data && typeof command.data.toJSON === 'function') return command.data.toJSON();
        if (typeof command.toJSON === 'function') return command.toJSON();
        return command;
      });
  }
}; 