/**
 * Logger utility for consistent logging across the backend
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

class Logger {
  constructor(name) {
    this.name = name;
    this.logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
  }

  /**
   * Write log to file
   */
  writeToFile(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${this.name}] ${message}${
      data ? ' ' + JSON.stringify(data) : ''
    }\n`;

    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * Info log
   */
  info(message, data = null) {
    console.log(`[INFO] [${this.name}] ${message}`, data || '');
    this.writeToFile('INFO', message, data);
  }

  /**
   * Warning log
   */
  warn(message, data = null) {
    console.warn(`[WARN] [${this.name}] ${message}`, data || '');
    this.writeToFile('WARN', message, data);
  }

  /**
   * Error log
   */
  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
    } : null;

    console.error(`[ERROR] [${this.name}] ${message}`, error || '');
    this.writeToFile('ERROR', message, errorData);
  }

  /**
   * Debug log (only in development)
   */
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] [${this.name}] ${message}`, data || '');
      this.writeToFile('DEBUG', message, data);
    }
  }
}

module.exports = Logger;
