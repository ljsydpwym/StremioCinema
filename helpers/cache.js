const apicache = require('apicache');

const env = require('./env.js')

let cache = apicache.middleware;
apicache.options({
    appendKey: (req, res) => {
        req.apicacheGroup = "cached"
        return req.url.split("/").slice(3).toString()
    },
    debug: env.DEBUG,
    enabled: env.CACHE,
})

const onlyStatus200 = (req, res) => res.statusCode === 200

function caching() {
    return cache(env.CACHE ? "200 minutes" : "1 second", onlyStatus200)
}

function initRoutes(app){
    app.get('/api/cache/performance', (req, res) => {
        res.json(apicache.getPerformance())
    })
    app.get('/api/cache/index', (req, res) => {
        res.json(apicache.getIndex())
    })
    app.get('/api/cache/clear/:target?', (req, res) => {
        res.json(apicache.clear(req.params.target))
    })
    
}

module.exports = {
    caching,
    initRoutes
}