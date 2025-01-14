const fs = require('fs');
const path = require('path');
const env = require('./env.js');

class Logger {
    constructor(tag, enabled = true) {
        this.tag = tag;
        this.enabled = enabled;
        this.logFile = path.join(__dirname, '..', 'log.txt');
    }

    log(message, level = 'info') {
        if (this.enabled) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${this.tag}] [${level.toUpperCase()}] ${message}`;
            console.log(logMessage);
            this.logToFile(logMessage);
        }
    }

    info(message) {
        this.log(message, 'info');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    error(message) {
        this.log(message, 'error');
    }

    logToFile(message) {
        fs.appendFileSync(this.logFile, message + '\n', 'utf8');
    }
}

module.exports = Logger;