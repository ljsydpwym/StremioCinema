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

	formatEpisodeMetaData(scMeta) {
		const label = scMeta._source.info_labels
		const translatedLabel = scMeta._source.i18n_info_labels[0]
		const premiere = new Date(label.premiered)
		premiere.setHours(23, 59, 59)
		const ret = {
			id: `${scMeta._source.root_parent}:${label.season}:${label.episode}`,
			title: translatedLabel.title ?? `Episode ${label.episode}`,
			season: label.season,
			episode: label.episode,
			overview: translatedLabel.plot,
			imdbRating: scMeta._source?.ratings?.overall?.rating,
			thumbnail: this.#checkIfHasRightProtocol(translatedLabel.art.poster || translatedLabel.art.fanart),
			released: premiere,
			available: scMeta._source.stream_info !== undefined,
		}
		logger.log("formatEpisodeMetaData", ret)
		return ret
	}

	createMeta(data, type, id) {
		id = helpers.getWithPrefix(id);
		const imdbId = data.services.imdb
		const label = data.info_labels
		const translatedLabelSk = data.i18n_info_labels[0]
		const translatedLabelEn = data.i18n_info_labels[2]
		const ret = {
			id: id,
			type: type == "movie" ? "movie" : "series",
			name: translatedLabelSk.title || translatedLabelEn.title,
			description: translatedLabelSk.plot || translatedLabelEn.plot,
			cast: data.cast.slice(0, 3).map(it => it.name),
			director: label.director.slice(0, 1),
			genres: label.genre,
			imdbRating: data?.ratings?.overall?.rating,
			runtime: (Math.round(label.duration / 60)) + " min",
			releaseInfo: label.year,
			logo: (imdbId ? `${this.META_HUB}/logo/medium/${imdbId}/img` : null),
			poster: (imdbId ? `${this.META_HUB}/poster/medium/${imdbId}/img` : this.#checkIfHasRightProtocol(translatedLabelSk.art.poster || translatedLabelSk.art.fanart)),
		};
		logger.log("formatMetaData", ret)
		return ret
	}

	async #callInternal(name, id, type) {
		return (await call('get', `https://v3-cinemeta.strem.io/${name}/${type}/${id}.json`)).body
	}

	#checkIfHasRightProtocol(url) {
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