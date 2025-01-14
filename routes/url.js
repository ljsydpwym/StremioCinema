const Logger = require('../helpers/logger.js');
const call = require('../api.js');

const logger = new Logger("URL", true);

async function getUrl(id) {
    try {
        const url = `https://webshare.cz/api/url/${id}.json`;
        const response = await call('get', url);
        if (response.statusCode === 200 && response.body && response.body.url) {
            return response.body.url;
        } else {
            throw new Error(`Failed to fetch URL from ${url}`);
        }
    } catch (error) {
        logger.error(`Error fetching URL: ${error.message}`);
        throw error;
    }
}

module.exports = async (req, res) => {
    const { id } = req.params;
    try {
        const url = await getUrl(id);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ url }));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};