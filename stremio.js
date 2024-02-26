const helpers = require('./helpers.js');
const call = require('./api.js');

class Stremio {

	constructor(){}

	META_HUB = "https://images.metahub.space";

	async meta(id, type) {
		return await this.#callInternal("meta", id, type)
	}

	formatMetaData(scMeta, type) {
		const id = helpers.getWithPrefix(scMeta._id);
		const imdbExists = scMeta._source.services.imdb != null;
		const label = scMeta._source.info_labels
		const translatedLabel = scMeta._source.i18n_info_labels[0]
		return {
			id: id,
			type: type == "movie" ? "movie" : "series",
			name: translatedLabel.title,
			description: translatedLabel.plot,
			cast: scMeta._source.cast.slice(0, 3).map(it => it.name),
			director: label.director.slice(0, 1),
			genres: label.genre,
			runtime: (Math.round(label.duration / 60)) + " min",
			releaseInfo: label.year,
			logo: (imdbExists ? `${this.META_HUB}/logo/medium/${id}/img` : null),
			poster: (imdbExists ? `${this.META_HUB}/poster/medium/` + scMeta._source.services.imdb + "/img" : this.#checkIfHasRightProtocol(translatedLabel.art.poster || translatedLabel.art.fanart)),
		};
	}

	formatEpisodeMetaData(scMeta) {
		const label = scMeta._source.info_labels
		const translatedLabel = scMeta._source.i18n_info_labels[0]
		const premiere = new Date(label.premiered)
		premiere.setHours(23, 59, 59)
		return {
			id: `${scMeta._source.root_parent}:${label.season}:${label.episode}`,
			title: translatedLabel.title ?? `Episode ${label.episode}`,
			season: label.season,
			episode: label.episode,
			overview: translatedLabel.plot,
			thumbnail: this.#checkIfHasRightProtocol(translatedLabel.art.poster || translatedLabel.art.fanart),
			released: premiere,
			available: scMeta._source.stream_info !== undefined,
		}
	}

	createMeta(data, type, id) {
		const label = data.info_labels
		const translatedLabel = data.i18n_info_labels[0]
		return {
			id,
			type,
			background: translatedLabel.art.fanart,
			name: translatedLabel.title,
			genres: label.genre,
			poster: this.#checkIfHasRightProtocol(translatedLabel.art.poster),
			description: translatedLabel.plot,
			director: label.director.slice(0, 1),
			released: new Date(label.premiered),
			runtime: (Math.round(label.duration / 60)) + " min",
		};
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