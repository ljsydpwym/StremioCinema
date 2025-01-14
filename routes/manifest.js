const Logger = require('../helpers/logger.js')
const env = require('../helpers/env.js')

const manifest = {
    id: env.PLUGIN_ID,
    version: env.VERSION,
    name: env.PLUGIN_NAME,
    description: "Stremio addon for streaming content from Webshare.cz",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series", "anime", "channel"],
    idPrefixes: ["tt", "kitsu:", "yt_id:"],
    catalogs: [
        {
            type: "movie",
            id: "webshare-movies",
            name: "Webshare Movies",
            extra: [{ name: "search", isRequired: false }]
        },
        {
            type: "series",
            id: "webshare-series",
            name: "Webshare Series",
            extra: [{ name: "search", isRequired: false }]
        },
        {
            type: "anime",
            id: "webshare-anime",
            name: "Webshare Anime",
            extra: [{ name: "search", isRequired: false }]
        },
        {
            type: "channel",
            id: "webshare-channels",
            name: "Webshare Channels",
            extra: [{ name: "search", isRequired: false }]
        }
    ],
    background: "https://stremio-cinema.com/background.jpg",
    logo: "https://stremio-cinema.com/logo.png",
    contactEmail: "support@stremio-cinema.com"
};

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(manifest));
};