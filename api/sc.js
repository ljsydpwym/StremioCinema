const crypto = require('crypto')
const call = require('./api.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')
const settings = require('../helpers/settings.js');

class SCC {

	constructor(params) {
		this.settings = settings.settingsLoader(params)
	}
	
	async filter(filter, params) {
		const res = await this.callInternal(`/filter/v2/${filter}`, params)
		const ret = JSON.parse(res)
		return ret
	}	

	async search(value, type = "*") {
		return JSON.parse(await this.callInternal(`/filter/v2/search`, {
			type: type,
			order: "desc",
			sort: "score",
			size: settings.pageSize,
			value: encodeURIComponent(value),
		}))
	}

	async searchFrom(type, from = 0) {
		return JSON.parse(await this.callInternal(`/filter/v2/news`, {
			type: type,
			order: "desc",
			sort: "dateAdded",
			days: "365",
			size: settings.pageSize,
			from: from,
		}))
	}

	async service(id, type) {
		return JSON.parse(await this.callInternal(`/filter/v2/service`, {
			type: type,
			service: "tmdb",
			value: id,
		}))
	}

	async streams(id) {
		return await this.callInternal(`/${id}/streams`)
	}

	async episode(id, season, episode) {
		const seasonsResponse = (await this.parent(id)).hits.hits
		const seasonId = (seasonsResponse.find(it => it._source.info_labels.season == season) ?? seasonsResponse[season - 1])._id;
		const episodesResponse = (await this.parent(seasonId)).hits.hits
		return episodesResponse[episode - 1]._id
	}

	async episodes(id) {
		const seasonsResponse = (await this.parent(id)).hits.hits;
		const episodes = [];
		for (const hit of seasonsResponse) {
			const seasonId = hit._id;
			const episodesResponse = (await this.parent(seasonId)).hits.hits;
			episodes.push(...episodesResponse);
		}
		return episodes;
	}

	async media(id) {
		return await this.callInternal(`/${id}`)
	}

	async parent(id) {
		return JSON.parse(await this.callInternal(`/filter/v2/parent`, {
			value: id,
			sort: "episode",
			size: 1000
		}))
	}

	uuidv4() {
		return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}

	async callInternal(path, params = {}) {
		const queries = helpers.queries({ ...params, access_token: env.SC_TOKEN })
		return (await call(
			`get`,
			`https://plugin.sc2.zone/api/media${path}`,
			queries,
			{
				headers: {
					"User-Agent": "XBMC/13.0-ALPHA3 Git:20130430-e8fe5cf (Windows NT 6.1;WOW64;Win64;x64; http://www.xbmc.org)",
					"X-Uuid": this.uuidv4(),
				}
			}
		)).body
	}

}

module.exports = SCC