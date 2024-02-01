const Logger = require('./logger.js')

const call = require('./api')
const crypto = require('crypto')
const md5crypt = require('./crypt')


const logger = new Logger("Webshare", false)
const baseUrl = "https://plugin.sc2.zone/api/media"
const token = "access_token=THszPfl9sbKnrIm6dXcX2f9fq8I"

class SC {
	PREFIX = "scc:"
    constructor() {
    }

	getWithPrefix(id){
		return `${this.PREFIX}${id}`
	}

	getWithoutPrefix(id) {
		return id.replace(this.PREFIX, "")
	}

	async search(value,type="*") {
		var ret = (await call(`get`, `${baseUrl}/filter/v2/search?type=${type}&order=desc&sort=score&value=${encodeURIComponent(value)}&${token}`)).body
		ret = JSON.parse(ret)
		logger.log("search", arguments, ret)
		return ret
	}

	async searchFrom(type,from=0){
		let ret = (await call(`get`,`${baseUrl}/filter/v2/news?type=${type}&sort=dateAdded&order=desc&days=365&${token}&from=${from}`)).body
		ret = JSON.parse(ret)
		logger.log("search", arguments, ret)
		return ret
	}

    async service(id, type) {
        var ret = (await call(`get`, `${baseUrl}/filter/v2/service?type=${type}&service=tmdb&value=${id}&${token}`)).body
        ret = JSON.parse(ret)
        logger.log("service", arguments, ret)
        return ret
    }

    async streams(id) {
        var ret = (await call(`get`, `${baseUrl}/${id}/streams?${token}`)).body
        logger.log("streams", arguments, ret)
        return ret
    }

	async episode(id, season, episode ) {
        const seasonsResponse = await this.parent(id)
        const seasonId = (seasonsResponse.hits.hits.find(it => it._source.info_labels.season == season) ?? seasonsResponse.hits.hits[season-1])._id;
        const episodesResponse = await this.parent(seasonId)
        var ret = episodesResponse.hits.hits[episode-1]._id
        logger.log("episode", arguments, ret)
        return ret
    }

	async episodes(id){
		const seasonsResponse = await this.parent(id);
		const hits = seasonsResponse.hits.hits;
		const episodes = [];
		for(const hit of hits){
			const seasonId = hit._id;
			const episodesResponse = await this.parent(seasonId);
			episodes.push(...episodesResponse.hits.hits);
		}
		return episodes;
	}

	async media(id){
		const ret = (await call(`get`, `${baseUrl}/${id}?${token}`)).body
		logger.log("media", arguments, ret)
		return ret
	}

    async parent(id) {
        var ret = (await call(`get`, `${baseUrl}/filter/v2/parent?value=${id}&sort=episode&${token}`)).body
        ret = JSON.parse(ret)
        logger.log("parent", arguments, ret)
        return ret
    }

}

module.exports = SC