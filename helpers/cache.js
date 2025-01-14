const apicache = require('apicache');
const env = require('./env.js');

let cache = apicache.middleware;

function initRoutes(app) {
    app.use(cache('5 minutes', (req, res) => res.statusCode === 200));
}

function configureCache(options) {
    apicache.options(options);
}

module.exports = {
    cache,
    initRoutes,
    configureCache
};