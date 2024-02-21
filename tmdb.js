const call = require('./api.js');
const helpers = require('./helpers.js');

class Tmdb {

	constructor(){}
    
    async find(imdbId) {
        return this.#callInternal(`/find/${imdbId}`, {
            external_source: "imdb_id"
        })
    }

    async show(id, season, episode) {
        return this.#callInternal(`/tv/${id}/season/${season}/episode/${episode}`)
    }

    async #callInternal(path, params = {}) {
        const queries = helpers.queries({ ...params, api_key: "ef7d0ef48dd68863160319b1a7231d6c" })
        return (await call(
            `get`,
            `https://api.themoviedb.org/3/${path}`,
            queries
        )).body
    }
}

module.exports = Tmdb