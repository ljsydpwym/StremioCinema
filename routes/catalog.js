const qs = require('querystring');
const Logger = require('../helpers/logger.js');
const call = require('../api.js');

const logger = new Logger("CATALOG", true);

async function getCatalog(type, id, extra) {
    try {
        const query = qs.stringify(extra);
        const url = `https://webshare.cz/api/catalog/${type}/${id}.json?${query}`;
        const response = await call('get', url);
        if (response.statusCode === 200 && response.body && response.body.catalog) {
            return response.body.catalog;
        } else {
            throw new Error(`Failed to fetch catalog from ${url}`);
        }
    } catch (error) {
        logger.error(`Error fetching catalog: ${error.message}`);
        throw error;
    }
}

module.exports = async (req, res) => {
    const { type, id } = req.params;
    const extra = req.query;
    try {
        const catalog = await getCatalog(type, id, extra);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ catalog }));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};