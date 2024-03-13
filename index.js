require('dotenv').config()
const Logger = require('./logger.js')
const SccMeta = require('./stremio.js')
const Webshare = require('./webshare.js')
const Tmdb = require('./tmdb.js')
const SCC = require('./sc.js')
const qs = require('querystring')
const env = require('./env.js')
const cypher = require('./cypher.js')
const helpers = require('./helpers.js')
const sentry = require('./sentry.js')
const catalogs = require('./catalogs.js')
const settings = require('./settings.js')

const express = require('express')
const apicache = require('./cache/apicache.js');
const cors = require('cors')
const app = express()

let cache = apicache.middleware;
apicache.options({
    appendKey: (req, res) => {
        req.apicacheGroup = "cached"
        return req.url.split("/").slice(3).toString()
    },
    debug: env.DEBUG,
    enabled: env.CACHE,
})

const path = require('path');

sentry.init(app)

app.use(cors())

const logger = new Logger("Main", true)

const scc = new SCC()
const tmdb = new Tmdb()
const webshare = new Webshare()

const baseUrl = '/1/:token'

const onlyStatus200 = (req, res) => res.statusCode === 200

function caching() {
    return cache(env.CACHE ? "200 minutes" : "1 second", onlyStatus200)
}

app.get(baseUrl + '/manifest.json', caching(), manifesf)
app.get(baseUrl + '/catalog/:type/:id/:extra?.json', caching(), catalog)
app.get(baseUrl + '/meta/:type/:id.json', caching(), meta);
app.get(baseUrl + '/stream/:type/:id.json', streams)
app.get('/stream/url/:id.json', url)
app.get('/', index)
app.get('/api/cache/performance', (req, res) => {
    res.json(apicache.getPerformance())
})
app.get('/api/cache/index', (req, res) => {
    res.json(apicache.getIndex())
})
app.get('/api/cache/clear/:target?', (req, res) => {
    res.json(apicache.clear(req.params.target))
})

function manifesf(req, res) {
    const loadedSettings = settings.loadSettings(req.params)
    res.setHeader('Content-Type', 'application/json')
    res.send({
        id: env.PLUGIN_ID,
        version: '1.0.0',
        name: env.PLUGIN_NAME,
        description: "Add-on to hook into SCC and Webshare VIP search",
        resources: ['stream', 'catalog', {
            name: "meta",
            types: catalogs.SUPPORTED_TYPES,
            idPrefix: [helpers.PREFIX],
        }],
        catalogs: catalogs.catalogsManifest(loadedSettings.explicit),
        types: catalogs.SUPPORTED_TYPES,
    })
}


async function catalog(req, res) {
    const loadedSettings = settings.loadSettings(req.params)
    const sccMeta = new SccMeta(loadedSettings)
    const { id, type } = req.params;
    logger.log("catalog", req.params)
    const stremioType = type
    if (!helpers.startWithPrefix(id)) {
        return res.status(404).send("Not found");
    }
    const catalog_key = id.split("_")[1]

    const extra = req.params.extra ? qs.parse(req.params.extra) : { search: null, skip: null, genre: null };

    let sccType;
    switch (stremioType) {
        case helpers.STREMIO_TYPE.MOVIE:
            sccType = helpers.SCC_TYPE.MOVIE;
            break;
        case helpers.STREMIO_TYPE.SHOW:
            sccType = helpers.SCC_TYPE.SHOW;
            break;
        case helpers.STREMIO_TYPE.ANIME:
            sccType = helpers.SCC_TYPE.ANIME;
            break;
        default:
            sccType = undefined;
    }
    if (sccType === undefined) {
        logger.log("for id " + stremioType + " type is undefined");
        return res.json({ metas: [] });
    }
    const scData = await catalogsFetch(sccType, catalog_key, extra);
    if(!scData){
        return res.status(404).send("Not found");
    }
    const scItems = scData.hits.hits;
    const metas = await Promise.all(
        Object.entries(scItems)
            .filter(([_, it]) => {
                const genres = it._source.info_labels.genre
                const isExplicit = genres.includes("Erotic") || genres.includes("Pornographic") || it._source.tags.includes("porno")
                return loadedSettings.explicit || !isExplicit
            })
            .map(([_, data]) => sccMeta.createMetaPreview(data, stremioType))
    )
    logger.log("metas length", metas.length)
    return res.json({ metas });
}


async function catalogsFetch(sccType, filter, extra) {
    const days = 100000
    const size = 30
    const laguages = "sk"
    var params = {}
    var filterParam = catalogs.FILTER.ALL
    switch (filter) {
        case catalogs.CATALOG_KEYS.new_releases_dubbed: {
            params[catalogs.QUERY.LANG] = laguages
            params[catalogs.QUERY.SORT] = catalogs.SORT.LANG_DATE_ADDED
            params[catalogs.QUERY.DAYS] = days
            filterParam = catalogs.FILTER.NEWS_DUBBED
            break
        }
        case catalogs.CATALOG_KEYS.new_releases: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.DATE_ADDED
            params[catalogs.QUERY.DAYS] = days
            filterParam = catalogs.FILTER.NEWS
            break
        }
        case catalogs.CATALOG_KEYS.last_added_children: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.LAST_CHILDREN_DATE_ADDED
            params[catalogs.QUERY.DAYS] = days
            break
        }
        case catalogs.CATALOG_KEYS.new_releases_children: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.LAST_CHILD_PREMIERED
            params[catalogs.QUERY.DAYS] = days
            filterParam = catalogs.FILTER.NEWS_CHILDREN
            break
        }
        case catalogs.CATALOG_KEYS.new_releases_subs: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.DATE_ADDED
            params[catalogs.QUERY.LANG] = laguages
            params[catalogs.QUERY.DAYS] = days
            filterParam = catalogs.FILTER.NEWS_SUBS
            break
        }
        case catalogs.CATALOG_KEYS.most_watched: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.PLAY_COUNT
            break
        }
        case catalogs.CATALOG_KEYS.popular: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.POPULARITY
            break
        }
        case catalogs.CATALOG_KEYS.trending: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.TRENDING
            break
        }
        case catalogs.CATALOG_KEYS.last_added: {
            params[catalogs.QUERY.SORT] = catalogs.SORT.DATE_ADDED
            break
        }
        case catalogs.CATALOG_KEYS.genre: {
            const genreKey = catalogs.GENRES.find(it => it.name == extra.genre)?.key
            if(!genreKey){
                return undefined
            }
            params[catalogs.QUERY.SORT] = catalogs.SORT.YEAR
            params[catalogs.QUERY.VALUE] = encodeURIComponent(genreKey)
            filterParam = catalogs.FILTER.GENRE
            break
        }
        default: {
            if(!extra.search){
                return undefined
            }
            params[catalogs.QUERY.VALUE] = encodeURIComponent(extra.search)
            params[catalogs.QUERY.SORT] = catalogs.SORT.SCORE
            filterParam = catalogs.FILTER.SEARCH
            break
        } 
    }
    params[catalogs.QUERY.TYPE] = sccType
    params[catalogs.QUERY.ORDER] = catalogs.ORDER.DESCENDING
    params[catalogs.QUERY.SIZE] = size
    if(extra.skip){
        params[catalogs.QUERY.FROM] = extra.skip
    }
    const ret = await scc.filter(filterParam, params)
    return ret
}

async function meta(req, res) {
    const loadedSettings = settings.loadSettings(req.params)
    const sccMeta = new SccMeta(loadedSettings)
    const { type, id } = req.params;
    logger.log("meta", req.params)

    if (!helpers.startWithPrefix(id)) {
        return res.status(404).send("Not found");
    }

    let sccId = helpers.getWithoutPrefix(id);

    const data = await scc.media(sccId);
    const meta = await sccMeta.createMeta(data, type, id);
    if (type === helpers.STREMIO_TYPE.SHOW || type === helpers.STREMIO_TYPE.ANIME) {
        const episodes = await scc.episodes(sccId);
        if (!meta.videos) {
            meta.videos = episodes.map(it => sccMeta.createMetaEpisode(data, it))
        } else {
            meta.videos = sccMeta.insertIds(meta, data)
        }
        meta.type = helpers.STREMIO_TYPE.SHOW
    }
    return res.send({ meta });
}

async function streams(req, res) {
    const { type, id, token } = req.params
    logger.log("defineStreamHandler", req.params)
    const idParts = id.split(":")
    const mediaId = idParts[0];
    let scId;
    if (type === helpers.STREMIO_TYPE.SHOW || type === helpers.STREMIO_TYPE.ANIME) {
        scId = await getShow(mediaId, idParts[1], idParts[2])
    } else {
        scId = await getMovie(mediaId, idParts[1], idParts[2])
    }
    if (!scId) {
        return res.send({ streams: [] })
    }
    logger.log("scId", scId)
    const scStreams = Array.from(await scc.streams(scId))
    logger.log("scStreams", scStreams)
    await webshare.loginIfNeeded(token)
    const webshareMeta = await getWebshareMeta(scStreams)
    logger.log("webshareMeta", webshareMeta)
    const streams = await getStreams(webshareMeta, req)
    logger.log("streams", streams)
    res.send({ streams: streams })
}


async function getShow(mediaId, season, episode) {
    let scId;
    try {
        if (helpers.startWithPrefix(mediaId)) {
            scId = (await scc.episode(helpers.getWithoutPrefix(mediaId), season, episode))
            logger.log("episode found")
        } else {
            try {
                const scFile = (await scc.search(mediaId, helpers.SCC_TYPE.SHOW)).hits.hits[0]
                logger.log("scShow", scFile);
                scId = (await scc.episode(scFile._id, season, episode))
                logger.log("episode found")
            } catch (e) {
                logger.log("fallbacking with error", e)
                const tmdbShow = (await tmdb.find(mediaId)).tv_results[0]
                logger.log("tmdbShow", tmdbShow)
                const search = tmdbShow.id
                const scShow = (await scc.service(search, helpers.SCC_TYPE.SHOW)).hits.hits[0]
                logger.log("scShow tmdb fallback", scShow);
                scId = (await scc.episode(scShow._id, season, episode))
                logger.log("episode found tmdb fallback search", search)
            }
        }
    } catch (e) {
        scId = undefined
    }
    return scId
}

async function getMovie(mediaId) {
    let scId;
    try {
        if (helpers.startWithPrefix(mediaId)) {
            scId = helpers.getWithoutPrefix(mediaId);
        } else {
            try {
                const scMovie = (await scc.search(mediaId, helpers.SCC_TYPE.MOVIE)).hits.hits[0]
                logger.log("scMovie", scMovie)
                scId = scMovie._id
                logger.log("movie found")
            } catch (e) {
                logger.log("fallbacking with error", e)
                const tmdbInfo = (await tmdb.find(mediaId))
                logger.log("tmdbInfo", tmdbInfo)
                const tmdbMovie = tmdbInfo.movie_results[0]
                logger.log("tmdbMovie", tmdbMovie)
                const search = tmdbMovie.id
                const scMovie = (await scc.service(search, helpers.SCC_TYPE.MOVIE)).hits.hits[0]
                scId = scMovie._id
                logger.log("movie not found - fallback search", search)
            }
        }
    } catch (e) {
        scId = undefined
    }
    return scId
}

async function getWebshareMeta(scStreams) {
    return scStreams
        .sort((a, b) => b.size - a.size)
        .map(it => {
            const firstVideo = it.video[0]
            const videoHeight = helpers.formatHeight(firstVideo.height)
            const videoHDR = helpers.formatHDR(firstVideo.hdr, firstVideo.codec, firstVideo["3d"])
            const audios = [...new Set(Array.from(it.audio)
                .filter(it => it.language !== undefined && it.language.length > 0)
                .map(it => helpers.formatAudio(it)))];
            const subtitles = [...new Set(Array.from(it.subtitles)
                .filter(it => it.language !== undefined && it.language.length > 0)
                .map(it => helpers.format(it.language))
                .sort((a, b) => a.localeCompare(b)))];

            const name = `💾\tSize:\t\t\t${helpers.bytesToSize(it.size)} [${helpers.formatBitrate(it)}]`
            const video = `📹\tVideo:\t\t${videoHeight} ${videoHDR}`
            const audio = audios ? "🔊\tAudio:\t\t" + audios.join(",") : undefined
            const subtitle = subtitles ? "💬\tSubtitles:\t" + subtitles.join(",") : undefined
            return {
                ident: it.ident,
                original: it,
                name: [name, video, audio, subtitle].join("\n"),
                subtitles: formatSubtitles(Array.from(it.subtitles), webshare),
                bingeGroup: `${video}-${audios.join("")}`
            }
        })
}
async function getStreams(files, req) {
    return await Promise.all(files.map(async (it) => {
        const link = await webshare.file_link(it.ident, it.original, "video_stream")
        const subtitles = await Promise.all(it.subtitles);
        const encrypted = cypher.encrypt(link)
        logger.log("encrypted", encrypted)
        const decrypted = cypher.decrypt(encrypted)
        logger.log("decrypted", decrypted)
        const url = `${req.protocol}://${req.get('host')}/stream/url/${encrypted}.json`
        return {
            url: url,
            name: env.PLUGIN_NAME,
            description: it.name,
            subtitles,
            behaviorHints: {
                bingeGroup: it.bingeGroup
            }
        }
    }))
}

const formatSubtitles = (subtitles, webshare) => {
    return subtitles.filter(s => s.src !== undefined).map(async (subtitle) => {
        const indent = subtitle.src.split("/").pop();
        return {
            id: indent,
            url: await webshare.file_link(indent, subtitle.src, "subtitle"),
            lang: subtitle.language ?? "unknown",
        }
    })
}

async function url(req, res) {
    logger.log("url", req.params)
    const { id } = req.params;
    const decrypted = cypher.decrypt(id)
    logger.log("decrypted", decrypted)
    res.redirect(decrypted)
}

function index(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'))
}

const port = env.PORT

app.listen(port, function () {
    console.log(`http://127.0.0.1:${port}/1/${env.WS_TOKEN}/manifest.json`)
})

module.exports = app