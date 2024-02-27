const helpers = require('./helpers.js');
const call = require('./api.js');
const Logger = require('./logger.js');

const logger = new Logger("Stremio", true)

class Stremio {

	constructor(){}

	META_HUB = "https://images.metahub.space";

	async meta(id, type) {
		return await this.#callInternal("meta", id, type)
	}

	formatMetaData(scMeta, type) {
		return this.createMeta(scMeta._source, type, scMeta._id)
	}

	formatEpisodeMetaData(showScMeta, scMeta) {
		const data = scMeta._source
		const universalShowMeta = this.#createUniversalMeta(showScMeta)
		const universalMeta = this.#createUniversalMeta(data)
		const premiere = new Date(universalMeta.label.premiered)
		premiere.setHours(23, 59, 59)
		const ret = {
			id: helpers.getWithPrefix(`${data.root_parent}:${universalMeta.label.season}:${universalMeta.label.episode}`),
			title: universalMeta.name || `Episode ${universalMeta.label.episode}`,
			season: universalMeta.label.season,
			episode: universalMeta.label.episode,
			overview: universalMeta.description,
			imdbRating: universalMeta.imdbRating,
			thumbnail: universalMeta.poster || universalShowMeta.poster,
			released: premiere,
			available: data.stream_info !== undefined,
		}
		logger.log("formatEpisodeMetaData", ret)
		return ret
	}

	createMeta(data, type, id) {
		id = helpers.getWithPrefix(id);
		const universalMeta = this.#createUniversalMeta(data)
		const ret = {
			id: id,
			type: type,
			name: universalMeta.name,
			description: universalMeta.description,
			cast: data.cast.slice(0, 3).map(it => it.name),
			director: universalMeta.label.director.slice(0, 1),
			genres: universalMeta.label.genre,
			imdbRating: universalMeta.imdbRating,
			runtime: universalMeta.runtime,
			releaseInfo: universalMeta.label.year,
			logo: universalMeta.imdbLogo,
			poster: universalMeta.poster,
		};
		logger.log("formatMetaData", ret)
		return ret
	}

	#createUniversalMeta(data) {
		const imdbId = data?.services?.imdb
		const imdbLogo = imdbId ? `${this.META_HUB}/logo/medium/${imdbId}/img` : null
		const imdbPoster = imdbId ? `${this.META_HUB}/poster/medium/${imdbId}/img` : null
		const label = data.info_labels
		const translatedLabelSk = data.i18n_info_labels[0]
		const translatedLabelEn = data.i18n_info_labels[2]
		const ret = {
			imdbId: imdbId,
			imdbLogo: imdbLogo,
			imdbPoster: imdbPoster,
			label: label,
			translatedLabelSk: translatedLabelSk,
			translatedLabelEn: translatedLabelEn,
			name: translatedLabelSk.title || translatedLabelEn.title,
			description: translatedLabelSk.plot || translatedLabelEn.plot,
			imdbRating: data?.ratings?.overall?.rating,
			runtime: (Math.round(label.duration / 60)) + " min",
			poster: this.#fixProtocol(translatedLabelSk.art?.poster || imdbPoster || translatedLabelSk.art?.fanart)
		};
		logger.log("createUniversalMeta", ret)
		return ret
	}

	async #callInternal(name, id, type) {
		return (await call('get', `https://v3-cinemeta.strem.io/${name}/${type}/${id}.json`)).body
	}

	#fixProtocol(url) {
		if (url === undefined || url === null) {
			return null;
		}
		if (url.startsWith("//")) {
			return "https:" + url;
		}
		return url;
	}

}

module.exports = Stremio