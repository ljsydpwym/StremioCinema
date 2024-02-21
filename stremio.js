const Logger = require('./logger.js');
const helpers = require('./helpers.js');
const call = require('./call.js');

class Stremio {

	META_HUB = "https://images.metahub.space";

	async meta(id, type) {
		return await this.#callInternal("meta", id, type)
	}

	formatMetaData(scMeta, type = "movie") {
		const id = helpers.sc.getWithPrefix(scMeta._id);
		const imdbExists = scMeta._source.services.imdb != null;
		return {
			id: id,
			type: type,
			name: scMeta._source.i18n_info_labels[0].title,
			description: scMeta._source.i18n_info_labels[0].plot,
			cast: scMeta._source.cast.slice(0, 3).map(it => it.name),
			director: scMeta._source.info_labels.director.slice(0, 1),
			genres: scMeta._source.info_labels.genre,
			runtime: (Math.round(scMeta._source.info_labels.duration / 60)) + " min",
			releaseInfo: scMeta._source.info_labels.year,
			logo: (imdbExists ? `${this.META_HUB}/logo/medium/${id}/img` : null),
			poster: (imdbExists ? `${this.META_HUB}/poster/medium/` + scMeta._source.services.imdb + "/img" : this.#checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.poster) ?? this.#checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.fanart)),
		};
	}

	formatEpisodeMetaData(scMeta) {
		return {
			id: `${scMeta._source.root_parent}:${scMeta._source.info_labels.season}:${scMeta._source.info_labels.episode}`,
			title: scMeta._source.i18n_info_labels[0].title ?? `Episode ${scMeta._source.info_labels.episode}`,
			season: scMeta._source.info_labels.season,
			episode: scMeta._source.info_labels.episode,
			overview: scMeta._source.i18n_info_labels[0].plot,
			thumbnail: this.#checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.poster) ?? this.#checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.fanart),
			released: new Date(scMeta._source.info_labels.premiered),
			available: scMeta._source.stream_info !== undefined,
		}
	}

	createMeta(data, type, id) {
		return {
			id,
			type,
			background: data.i18n_info_labels[0].art.fanart,
			name: data.i18n_info_labels[0].title,
			genres: data.info_labels.genre,
			poster: this.#checkIfHasRightProtocol(data.i18n_info_labels[0].art.poster),
			description: data.i18n_info_labels[0].plot,
			director: data.info_labels.director.slice(0, 1),
			released: new Date(data.info_labels.premiered),
			runtime: (Math.round(data.info_labels.duration / 60)) + " min",
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