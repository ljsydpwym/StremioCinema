const crypto = require('crypto')
const call = require('./call.js')
const md5crypt = require('./crypt.js')
const helpers = require('./helpers.js')

class SC {

	async search(value, type = "*") {
		return JSON.parse(await this.#callInternal(`/filter/v2/search`, {
			type: type,
			order: "desc",
			sort: "score",
			value: encodeURIComponent(value),
		}))
	}

	async searchFrom(type, from = 0) {
		return JSON.parse(await this.#callInternal(`/filter/v2/news`, {
			type: type,
			order: "desc",
			sort: "dateAdded",
			days: "365",
			from: from,
		}))
	}

	async service(id, type) {
		return JSON.parse(await this.#callInternal(`/filter/v2/service`, {
			type: type,
			service: "tmdb",
			value: id,
		}))
	}

	async streams(id) {
		return await this.#callInternal(`/${id}/streams`)
	}

	async episode(id, season, episode) {
		const seasonsResponse = await this.parent(id)
		const seasonId = (seasonsResponse.hits.hits.find(it => it._source.info_labels.season == season) ?? seasonsResponse.hits.hits[season - 1])._id;
		const episodesResponse = await this.parent(seasonId)
		return episodesResponse.hits.hits[episode - 1]._id
	}

	async episodes(id) {
		const seasonsResponse = await this.parent(id);
		const hits = seasonsResponse.hits.hits;
		const episodes = [];
		for (const hit of hits) {
			const seasonId = hit._id;
			const episodesResponse = await this.parent(seasonId);
			episodes.push(...episodesResponse.hits.hits);
		}
		return episodes;
	}

	async media(id) {
		return await this.#callInternal(`/${id}`)
	}

	async parent(id) {
		return JSON.parse(await this.#callInternal(`/filter/v2/parent`, {
			value: id,
			sort: "episode",
		}))
	}

	#uuidv4() {
		return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}

	async #callInternal(path, params = {}) {
		const queries = helpers.queries({ ...params, access_token: "9ajdu4xyn1ig8nxsodr3" })
		return (await call(
			`get`,
			`https://plugin.sc2.zone/api/media${path}`,
			queries,
			{
				headers: {
					"User-Agent": "XBMC/13.0-ALPHA3 Git:20130430-e8fe5cf (Windows NT 6.1;WOW64;Win64;x64; http://www.xbmc.org)",
					"X-Uuid": this.#uuidv4(),
				}
			}
		)).body
	}

}

module.exports = SC