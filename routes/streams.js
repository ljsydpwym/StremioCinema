const qs = require('querystring');
const Logger = require('../helpers/logger.js');
const call = require('../api.js');

const logger = new Logger("STREAMS", true);

async function getStreams(type, id) {
    try {
        const url = `https://webshare.cz/api/streams/${type}/${id}.json`;
        const response = await call('get', url);
        if (response.statusCode === 200 && response.body && response.body.streams) {
            return response.body.streams;
        } else {
            throw new Error(`Failed to fetch streams from ${url}`);
        }
    } catch (error) {
        logger.error(`Error fetching streams: ${error.message}`);
        throw error;
    }
}

module.exports = async (req, res) => {
    const { type, id } = req.params;
    try {
        const streams = await getStreams(type, id);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ streams }));
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};