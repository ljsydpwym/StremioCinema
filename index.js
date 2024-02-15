const Logger = require('./logger.js')
const Stremio = require('./stremio.js')
const Webshare = require('./webshare.js')
const Tmdb = require('./tmdb.js')
const SC = require('./sc.js')
const qs = require('querystring')
const Config = require('./config.js')
const {format, formatHeight, bytesToSize} = require('./helpers')

const express = require('express')
const cors = require('cors')
const app = express()
const path = require('path');
const config = new Config();

app.use(cors())

const baseUrl = '/1/:token'

app.get(baseUrl + '/manifest.json', function (req, res) {
    res.setHeader('Cache-Control', 'max-age=86400') // one day
    res.setHeader('Content-Type', 'application/json')
    res.send({
        id: config.getId(),
        version: '1.0.0',
        name: config.getName(),
        description: "Add-on to hook into SCC and Webshare VIP search",
        catalogs: [{
            type: 'movie',
            id: 'scc_movies_news',
            name: 'SCC - movies',
            extra: [
                {name: "search", isRequired: false},
            ]
        }, {
            type: 'series',
            id: 'scc_series_news',
            name: 'SCC - series',
            extra: [
                {name: "search", isRequired: false},
            ]
        }, {
            type: "anime",
            id: "scc_anime_news",
            name: "SCC - anime",
            extra: [
                {name: "search", isRequired: false},
            ]
        }
        ],
        resources: ['stream', 'catalog', {
            name: "meta",
            types: ["movie", "series", "anime"]
        }],
        types: ['movie', 'series', "anime"],
    })
})

app.get(baseUrl + '/log', function (req, res) {
    res.sendFile('log.txt', {root: __dirname})
})

const logger = new Logger("Main", config.isDev)

const sc = new SC()
const stremio = new Stremio(sc)
const tmdb = new Tmdb()

app.get(baseUrl + '/stream/:type/:id.json', async function (req, res) {
    const webshare = new Webshare()
    const args = req.params
    logger.log("defineStreamHandler", args)
    let scId
    if (args.type === 'series' || args.type === "anime") {
        const idParts = args.id.split(":")
        const season = idParts[1]
        const episode = idParts[2]
        logger.log("idParts", idParts)

        const mediaId = idParts[0];
        const isImdbId = mediaId.startsWith("tt");

        if (!isImdbId) {
            scId = await sc.episode(mediaId, season, episode)
            logger.log("episode found")
        } else {
            try {
                const scShow = await sc.search(mediaId, "*")
                logger.log("scShow", scShow.hits.hits[0]);
                scId = await sc.episode(scShow.hits.hits[0]._id, season, episode)
                logger.log("episode found")
            } catch (e) {
                logger.log("error", e)

                const tmdbInfo = await tmdb.find(mediaId)
                logger.log("tmdbInfo", tmdbInfo)
                const tmdbShow = tmdbInfo.tv_results[0]
                logger.log("tmdbShow", tmdbShow)

                const search = `${tmdbShow.name}`
                const fallbackSearch = (await sc.search(search, "*")).hits.hits
                const scShowId = fallbackSearch[0]._id
                scId = await sc.episode(scShowId, season, episode)
                logger.log("episode NOT found - fallback search", search)
            }
        }
    } else {
        try {
            const mediaId = args.id;
            const isImdbId = mediaId.startsWith("tt")
            if (!isImdbId) {
                scId = sc.getWithoutPrefix(mediaId);
            } else {
                const scFiles = (await sc.search(mediaId, 'movie')).hits.hits
                logger.log("scFiles", scFiles)
                let scImdbMovie
                if (scFiles.length >= 1) {
                    scImdbMovie = scFiles[0]
                    logger.log("movie found")
                } else {
                    const tmdbInfo = await tmdb.find(mediaId)
                    logger.log("tmdbInfo", tmdbInfo)
                    const tmdbMovie = tmdbInfo.movie_results[0]
                    logger.log("tmdbMovie", tmdbMovie)
                    const search = tmdbMovie.title
                    const scMovies = (await sc.search(search, 'movie')).hits.hits
                    scImdbMovie = scMovies[0]
                    logger.log("movie not found - fallback search", search)
                }
                if (scImdbMovie === undefined) {
                    throw new Error("Movie not found")
                }
                scId = scImdbMovie._id
            }
        } catch (e) {
            logger.log("error", e)
            return res.send({streams: []})
        }
    }

    logger.log("scId", scId)
    const scStreams = await sc.streams(scId)
    logger.log("scStreams", scStreams)
    await webshare.loginIfNeeded(args.token)

    const files = Array.from(scStreams)
        .sort((a, b) => b.size - a.size)
        .map(it => {
                const videos = Array.from(it.video)
                    .filter(it => it.height !== undefined)
                    .map(it => formatHeight(it.height))
                const audios = [...new Set(Array.from(it.audio)
                    .filter(it => it.language !== undefined && it.language.length > 0)
                    .map(it => format(it.language))
                    .sort((a, b) => a.localeCompare(b)))];
                const subtitles = [...new Set(Array.from(it.subtitles)
                    .filter(it => it.language !== undefined && it.language.length > 0)
                    .map(it => format(it.language))
                    .sort((a, b) => a.localeCompare(b)))];

                const name = `Size: ${bytesToSize(it.size)}`
                const video = videos ? "Video: " + videos.join(",") : undefined
                const audio = audios ? "Audio: " + audios.join(",") : undefined
                const subtitle = subtitles ? "Subtitles: " + subtitles.join(",") : undefined
                return {
                    ident: it.ident,
                    original: it,
                    name: [name, video, audio, subtitle].join("\n"),
                    subtitles: formatSubtitles(Array.from(it.subtitles),webshare)

                }
            }
        )
    logger.log("files", files)
    await webshare.loginIfNeeded(args.token)
    const streams = await Promise.all(files.map(async (it) => {
        const link = await webshare.file_link(it.ident, it.original, "video_stream")
        const subtitles = await Promise.all( it.subtitles);
        return {
            url: link,
            title: `${it.name}`,
            subtitles
        }
    }))
    const output = {streams: streams}
    logger.log("output", output)
    res.send(output)
})

const formatSubtitles = (subtitles,webshare) =>{
    return subtitles.filter(s => s.src !== undefined).map(async (subtitle)=>{
        const indent = subtitle.src.split("/").pop();
        return {
            id:indent,
            url:await webshare.file_link(indent, subtitle.src, "subtitle"),
            lang:subtitle.language ?? "unknown",
        }
    })
}

async function fetchAndFormatData(type, search, skip) {
    const scData = search ? await sc.search(search, type) : await sc.searchFrom(type, skip);
    const scMovies = scData.hits.hits;
    return Object.entries(scMovies).map(([_, data]) => stremio.formatMetaData(data, type === "movie" ? undefined : "series"));
}

app.get(baseUrl + '/catalog/:type/:id/:extra?.json', async function (req, res) {
    const {id} = req.params;
    logger.log("catalog", req.params)
    const splitted = id.split("_");
    const prefix = splitted[0];
    const realId = splitted[1];
    const sorting = splitted[2];
    if (prefix !== "scc") {
        return res.status(404).send("Not found");
    }

    const extra = req.params.extra ? qs.parse(req.params.extra) : {search: null, skip: null};
    if (extra.skip === undefined)
        extra.skip = null;
    if (extra.search === undefined)
        extra.search = null;
    let type;
    switch (realId) {
        case "movies":
            type = "movie";
            break;
        case "series":
            type = "tvshow";
            break;
        case "anime":
            type = "anime";
            break;
        default:
            type = undefined;
    }
    if (type === undefined) {
        logger.log("for id " + realId + " type is undefined");
        return res.json({metas: []});
    }
    const metas = await fetchAndFormatData(type, extra.search, extra.skip);
    logger.log("metas", metas)
    return res.json({metas});
})


app.get(baseUrl + '/meta/:type/:id.json', async function (req, res) {
    const {type, id} = req.params;
    logger.log("meta", req.params)

    if (!id.startsWith(sc.PREFIX) && type !== "anime") {
        return res.status(404).send("Not found");
    }

    let sccId = sc.getWithoutPrefix(id);

    if (type === "series") {
        const data = await sc.media(sccId);
        const episodes = await sc.episodes(sccId);
        const meta = stremio.createMeta(data, type, id);
        meta.videos = episodes.map(it => stremio.formatEpisodeMetaData(it));
        return res.send({meta});
    }

    if (type === "movie") {
        const data = await sc.media(sccId);
        const meta = stremio.createMeta(data, type, id);
        return res.send({meta});
    }

    if (type === "anime") {
        if (id.startsWith("tt")) {
            sccId = (await sc.search(id, type)).hits.hits[0]._id;
        }
        logger.log("sccId", sccId);
        const data = await sc.media(sccId);
        const episodes = await sc.episodes(sccId);
        const meta = stremio.createMeta(data, type, id);
        meta.videos = episodes.map(it => stremio.formatEpisodeMetaData(it));
        return res.send({meta});
    }
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'))
})

const port = process.env.PORT || 4000

app.listen(port, function () {
    console.log(`http://127.0.0.1:${port}${baseUrl}/manifest.json`)
})

module.exports = app