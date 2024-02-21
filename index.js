require('dotenv').config()
const Logger = require('./logger.js')
const Stremio = require('./stremio.js')
const Webshare = require('./webshare.js')
const Tmdb = require('./tmdb.js')
const SC = require('./sc.js')
const qs = require('querystring')
const env = require('./env.js')
const cypher = require('./cypher.js')
const helpers = require('./helpers.js')
const sentry = require('./sentry.js')

const express = require('express')
const cors = require('cors')
const app = express()
const path = require('path');

sentry.init(app)

app.use(cors())

const logger = new Logger("Main", true)

const sc = new SC()
const stremio = new Stremio()
const tmdb = new Tmdb()
const webshare = new Webshare()

const baseUrl = '/1/:token'

app.get(baseUrl + '/manifest.json', manifesf)
app.get(baseUrl + '/catalog/:type/:id/:extra?.json', catalog)
app.get(baseUrl + '/meta/:type/:id.json', meta);
app.get(baseUrl + '/stream/:type/:id.json', streams)
app.get('/stream/url/:id.json', url)
app.get('/', index)

function manifesf(req, res) {
    res.setHeader('Cache-Control', 'max-age=86400') // one day
    res.setHeader('Content-Type', 'application/json')
    res.send({
        id: env.PLUGIN_ID,
        version: '1.0.0',
        name: env.PLUGIN_NAME,
        description: "Add-on to hook into SCC and Webshare VIP search",
        resources: ['stream', 'catalog', {
            name: "meta",
            types: [helpers.STREMIO_TYPE.MOVIE, helpers.STREMIO_TYPE.SHOW, helpers.STREMIO_TYPE.ANIME],
            idPrefix: [helpers.PREFIX],
        }],
        catalogs: [{
            type: helpers.STREMIO_TYPE.MOVIE,
            id: 'scc_movies_news',
            name: 'SCC - movies',
            extra: [
                { name: "search", isRequired: false },
            ]
        },
        {
            type: helpers.STREMIO_TYPE.SHOW,
            id: 'scc_series_news',
            name: 'SCC - series',
            extra: [
                { name: "search", isRequired: false },
            ]
        },
        {
            type: helpers.STREMIO_TYPE.ANIME,
            id: "scc_anime_news",
            name: "SCC - anime",
            extra: [
                { name: "search", isRequired: false },
            ]
        }
        ],
        types: [helpers.STREMIO_TYPE.MOVIE, helpers.STREMIO_TYPE.SHOW, helpers.STREMIO_TYPE.ANIME],
    })
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
    const scStreams = Array.from(await sc.streams(scId))
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
            scId = (await sc.episode(helpers.getWithoutPrefix(mediaId), season, episode))
            logger.log("episode found")
        } else {
            try {
                const scFile = (await sc.search(mediaId, helpers.SCC_TYPE.SHOW)).hits.hits[0]
                logger.log("scShow", scFile);
                scId = (await sc.episode(scFile._id, season, episode))
                logger.log("episode found")
            } catch (e) {
                logger.log("fallbacking with error", e)
                const tmdbShow = (await tmdb.find(mediaId)).tv_results[0]
                logger.log("tmdbShow", tmdbShow)
                const search = tmdbShow.name
                const scShow = (await sc.search(search, helpers.SCC_TYPE.SHOW)).hits.hits[0]
                logger.log("scShow tmdb fallback", scShow);
                scId = (await sc.episode(scShow._id, season, episode))
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
                const scMovie = (await sc.search(mediaId, helpers.SCC_TYPE.MOVIE)).hits.hits[0]
                logger.log("scMovie", scMovie)
                scId = scMovie._id
                logger.log("movie found")
            } catch (e) {
                logger.log("fallbacking with error", e)
                const tmdbInfo = (await tmdb.find(mediaId))
                logger.log("tmdbInfo", tmdbInfo)
                const tmdbMovie = tmdbInfo.movie_results[0]
                logger.log("tmdbMovie", tmdbMovie)
                const search = tmdbMovie.title
                const scMovie = (await sc.search(search, helpers.SCC_TYPE.MOVIE)).hits.hits[0]
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
            const videos = Array.from(it.video)
                .filter(it => it.height !== undefined)
                .map(it => helpers.formatHeight(it.height))
            const audios = [...new Set(Array.from(it.audio)
                .filter(it => it.language !== undefined && it.language.length > 0)
                .map(it => helpers.format(it.language))
                .sort((a, b) => a.localeCompare(b)))];
            const subtitles = [...new Set(Array.from(it.subtitles)
                .filter(it => it.language !== undefined && it.language.length > 0)
                .map(it => helpers.format(it.language))
                .sort((a, b) => a.localeCompare(b)))];

            const name = `Size: ${helpers.bytesToSize(it.size)}`
            const video = videos ? "Video: " + videos.join(",") : undefined
            const audio = audios ? "Audio: " + audios.join(",") : undefined
            const subtitle = subtitles ? "Subtitles: " + subtitles.join(",") : undefined
            return {
                ident: it.ident,
                original: it,
                name: [name, video, audio, subtitle].join("\n"),
                subtitles: formatSubtitles(Array.from(it.subtitles), webshare),
                bingeGroup: `${videos.join("")}-${audios.join("")}`
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
            title: `${it.name}`,
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

async function fetchAndFormatData(sccType, stremioType, search, skip) {
    const scData = search ? await sc.search(search, sccType) : await sc.searchFrom(sccType, skip);
    const scMovies = scData.hits.hits;
    return Object.entries(scMovies).map(([_, data]) => stremio.formatMetaData(data, stremioType));
}

async function url(req, res) {
    logger.log("url", req.params)
    const { id } = req.params;
    const decrypted = cypher.decrypt(id)
    logger.log("decrypted", decrypted)
    res.redirect(decrypted)
}

async function catalog(req, res) {
    const { id, type } = req.params;
    logger.log("catalog", req.params)
    const stremioType = type
    if (!helpers.startWithPrefix(id)) {
        return res.status(404).send("Not found");
    }

    const extra = req.params.extra ? qs.parse(req.params.extra) : { search: null, skip: null };
    if (extra.skip === undefined)
        extra.skip = null;
    if (extra.search === undefined)
        extra.search = null;
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
    const metas = await fetchAndFormatData(sccType, stremioType, extra.search, extra.skip);
    logger.log("metas", metas)
    return res.json({ metas });
}

async function meta(req, res) {
    const { type, id } = req.params;
    logger.log("meta", req.params)

    if (!helpers.startWithPrefix(id)) {
        return res.status(404).send("Not found");
    }

    let sccId = helpers.getWithoutPrefix(id);

    const data = await sc.media(sccId);
    const meta = stremio.createMeta(data, type, id);
    if (type === helpers.STREMIO_TYPE.SHOW || type === helpers.STREMIO_TYPE.ANIME) {
        const episodes = await sc.episodes(sccId);
        meta.videos = episodes.map(it => stremio.formatEpisodeMetaData(data, it));
    }
    return res.send({ meta });
}

function index(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'))
}

const port = env.PORT

app.listen(port, function () {
    console.log(`http://127.0.0.1:${port}${baseUrl}/manifest.json`)
})

module.exports = app