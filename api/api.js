const Logger = require('../helpers/logger.js')
const needle = require('needle');

const logger = new Logger("CALL", true)

async function call(method, url, data = null) {
    try {
        const options = {
            json: true,
        };
        let response;
        if (method.toLowerCase() === 'get') {
            response = await needle('get', url, options);
        } else if (method.toLowerCase() === 'post') {
            response = await needle('post', url, data, options);
        } else if (method.toLowerCase() === 'put') {
            response = await needle('put', url, data, options);
        } else if (method.toLowerCase() === 'delete') {
            response = await needle('delete', url, options);
        } else {
            throw new Error(`Unsupported HTTP method: ${method}`);
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
            return response;
        } else {
            throw new Error(`HTTP error: ${response.statusCode} ${response.statusMessage}`);
        }
    } catch (error) {
        logger.error(`Error calling ${method} ${url}: ${error.message}`);
        throw error;
    }
}

module.exports = call;