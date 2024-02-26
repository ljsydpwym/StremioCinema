const env = require('./env.js')

class Logger {

    constructor(tag, enabled) {
        this.tag = tag + " "
        this.enabled = enabled
    }

    log(message, ...optionalParams) {
        if (env.DEBUG) {
            console.log(this.tag + message, ...optionalParams)
        }
    }

}

module.exports = Logger