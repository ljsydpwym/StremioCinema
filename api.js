const Logger = require('./logger.js')
const needle = require('needle');

const logger = new Logger("CALL", false)

async function call(method, url, data, options) {
    logger.log("Api request", arguments)
    const response = await needle(method, url, data, options)
    return response
}

module.exports = call