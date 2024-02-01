const Logger = require('./logger.js')
const call = require('./api');

const logger = new Logger("Stremio", false)
const baseUrl = "https://api.themoviedb.org/3"
const token = "api_key=ef7d0ef48dd68863160319b1a7231d6c"

class Tmdb{

    async find(imdbId) {
        const ret = (await call('get', `${baseUrl}/find/${imdbId}?external_source=imdb_id&${token}`)).body
        logger.log("find", arguments, ret)
        return ret
    }

    async show(id, season, episode) {
        const ret = (await call('get', `${baseUrl}/tv/${id}/season/${season}/episode/${episode}?${token}`)).body
        logger.log("show", arguments, ret)
        return ret
    }

}

module.exports = Tmdb