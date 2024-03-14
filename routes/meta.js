const qs = require('querystring')

const SCC = require('../api/sc.js')

const Logger = require('../helpers/logger.js')
const {settingsLoader} = require('../helpers/settings.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')

const catalogs = require('../logic/catalogs.js')
const SccMeta = require('../logic/stremio.js')
const types = require('../logic/types.js')

const logger = new Logger("manifest", true)

async function meta(req, res) {
    const { type, id, token } = req.params
    const settings = settingsLoader(token)
    const sccMeta = new SccMeta(settings)
    const scc = new SCC()
    logger.log("meta", req.params)

    if (!helpers.startWithPrefix(id)) {
        return res.status(404).send("Not found");
    }

    let sccId = helpers.getWithoutPrefix(id);

    const data = await scc.media(sccId);
    const meta = await sccMeta.createMeta(data, type, id);
    if (type === types.STREMIO_TYPE.SHOW || type === types.STREMIO_TYPE.ANIME) {
        const episodes = await scc.episodes(sccId);
        if (!meta.videos) {
            meta.videos = episodes.map(it => sccMeta.createMetaEpisode(data, it))
        } else {
            meta.videos = sccMeta.insertIds(meta, data)
        }
        meta.type = types.STREMIO_TYPE.SHOW
    }
    return res.send({ meta });
}

module.exports = {
    meta
}