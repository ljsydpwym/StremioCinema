const Logger = require('./logger.js')
const call = require('./api');

const logger = new Logger("Stremio", false)
const baseUrl = "https://v3-cinemeta.strem.io"
const META_HUB = "https://images.metahub.space";
class Stremio{

	constructor(sc) {
		this.sc = sc;
	}

    async universal(name, id, type) {
        const ret = (await call('get', `${baseUrl}/${name}/${type}/${id}.json`)).body
        logger.log("universal", arguments, ret)
        return ret
    }

    async meta(id, type) {
        const ret = await this.universal("meta", id, type)
        logger.log("meta", arguments, ret)
        return ret
    }

	checkIfHasRightProtocol(url) {
		if(url === undefined || url === null){
			return null;
		}
		if(url.startsWith("//")){
			return "https:" + url;
		}
		return url;
	}

	formatMetaData(scMeta, type = "movie") {
		const id = scMeta._source.services.imdb ?? this.sc.getWithPrefix(scMeta._id);
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
			logo: (imdbExists ? `${META_HUB}/logo/medium/${id}/img` : null),
			poster: (imdbExists ? `${META_HUB}/poster/medium/` + scMeta._source.services.imdb + "/img" : this.checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.poster) ?? this.checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.fanart)),
		};
	}

	formatEpisodeMetaData(scMeta) {
		return {
			id: `${scMeta._source.root_parent}:${scMeta._source.info_labels.season}:${scMeta._source.info_labels.episode}`,
			title: scMeta._source.i18n_info_labels[0].title ?? `Episode ${scMeta._source.info_labels.episode}`,
			season: scMeta._source.info_labels.season,
			episode: scMeta._source.info_labels.episode,
			overview: scMeta._source.i18n_info_labels[0].plot,
			thumbnail: this.checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.poster) ?? this.checkIfHasRightProtocol(scMeta._source.i18n_info_labels[0].art.fanart),
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
			poster: this.checkIfHasRightProtocol(data.i18n_info_labels[0].art.poster),
			description: data.i18n_info_labels[0].plot,
			director: data.info_labels.director.slice(0, 1),
			released: new Date(data.info_labels.premiered),
			runtime: (Math.round(data.info_labels.duration / 60)) + " min",
		};
	}


}

module.exports = Stremio