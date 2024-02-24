const env = require('./env.js')

class Logger {

    constructor(tag) {
        this.tag = tag + " "
    }

    log(message, ...optionalParams) {
        if (env.DEBUG) {
            console.log(this.tag + message, ...optionalParams)
        }
    }

}

module.exports = Logger