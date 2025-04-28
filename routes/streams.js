const qs = require('querystring')
const { stringSimilarity } = require('string-similarity-js');

const Logger = require('../helpers/logger.js')
const { settingsLoader } = require('../helpers/settings.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')
const cypher = require('../helpers/cypher.js')

const types = require('../logic/types.js')

const Webshare = require('../api/webshare.js')
const Tmdb = require('../api/tmdb.js')
const SCC = require('../api/sc.js')

const logger = new Logger("streams", true)

async function loadStreams(params){
    const { type, id, token } = params
    const settings = settingsLoader(token)

    const tmdb = new Tmdb()
    const webshare = new Webshare()

    async function both(params) {
        logger.log("defineStreamHandler", params)
        const idParts = id.split(":")
        const mediaId = idParts[0];
        
        const tmdbResult = await tmdb.find(mediaId)

        let results;
        if (type === types.STREMIO_TYPE.SHOW || type === types.STREMIO_TYPE.ANIME) {
            const name = tmdbResult.tv_results[0].name
            const season = idParts[1]
            const episode = idParts[2]
            const se = `S${toTwo(season)}E${toTwo(episode)}`
            results = await search(name, se)
        } else {
            const name = tmdbResult.movie_results[0].title
            results = await search(name)
        }
        if (!results) {
            return []
        }
        logger.log("numberOfStreams", results.length)
        await webshare.loginIfNeeded(settings.token)
        const streams = await getStreams(results)
        logger.log("streams", streams)
        return streams
    }
    
    function toTwo(value){
        if(value.length == 1){
            return `0${value}`
        }else{
            return value
        }
    }
    
    async function search(name, part) {
        let results = [];
        let page = 0
        while(results.length < 10 && page < 10){
            try {
                const withPart = part ? `${name} ${part}` : name
                const finds = (await webshare.search(withPart, page))
                const result = finds.filter(it => stringSimilarity(it.name, withPart) > 0.3).filter(it => part ? it.name.includes(part) : true)
                results = results.concat(result)
                logger.log("result", result);
            } catch (e) {
            }
            page++
        }
        
        return results
    }
    
    async function getStreams(results) {
        const streams = await Promise.all(results.map(async (it) => {
            const link = await webshare.file_link(it.ident, it.original, "video_stream")
            const url = link
            return {
                url: url,
                name: env.PLUGIN_NAME,
                description: it.name,
            }
        }))
        return streams.filter(it => !it.url.includes("FILE_LINK"))
    }
    
    return await both(params)
}

async function streams(req, res){
    const all = await loadStreams(req.params)
    res.send({ streams: all })
}

module.exports = {
    streams,
    loadStreams
}