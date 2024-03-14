const qs = require('querystring')

const Logger = require('../helpers/logger.js')
const { settingsLoader } = require('../helpers/settings.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')
const cypher = require('../helpers/cypher.js')

const Webshare = require('../api/webshare.js')
const Tmdb = require('../api/tmdb.js')
const SCC = require('../api/sc.js')

const logger = new Logger("streams", true)

async function streams(req, res){
    const { type, id, token } = req.params
    const settings = settingsLoader(token)

    const scc = new SCC(settings)
    const tmdb = new Tmdb()
    const webshare = new Webshare()

    async function streams(req, res) {
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
        await webshare.loginIfNeeded(settings.token)
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
                    .map(it => helpers.formatAudio(it) + (settings.showAudioExtra ? helpers.formatAudioExtra(it) : '')))];
                const subtitles = [...new Set(Array.from(it.subtitles)
                    .filter(it => it.language !== undefined && it.language.length > 0)
                    .map(it => helpers.format(it.language))
                    .sort((a, b) => a.localeCompare(b)))];
    
                const name = `💾\tSize:\t\t\t${helpers.bytesToSize(it.size)} ${settings.showBitrate ? helpers.formatBitrate(it) : ''}`
                const video = `📹\tVideo:\t\t${videoHeight} ${settings.showVideoExtra ? videoHDR : ''}`
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

    return await streams(req, res)
}

module.exports = {
    streams
}