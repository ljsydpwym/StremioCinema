const qs = require('querystring');
const Logger = require('../helpers/logger.js');
const call = require('../api.js');
const SCC = require('../api/sc.js');

const logger = new Logger("META", true);

async function getMeta(type, id) {
    try {
        const url = `https://webshare.cz/api/meta/${type}/${id}.json`;
        const response = await call('get', url);
        if (response.statusCode === 200 && response.body && response.body.meta) {
            return response.body.meta;
        } else {
            throw new Error(`Failed to fetch meta from ${url}`);
        }
    } catch (error) {
        logger.error(`Error fetching meta: ${error.message}`);
        throw error;
    }
}

module.exports = async (req, res) => {
    const { type, id } = req.params;
    try {
        const meta = await getMeta(type, id);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ meta }));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};