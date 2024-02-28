const helpers = require('./helpers.js');
const call = require('./api.js');
const Logger = require('./logger.js');
const Addons = require('./helpers.js');

const logger = new Logger("Stremio", true)

class SccMeta {

	constructor() { }

	META_HUB_IMAGES = "https://images.metahub.space";
	META_HUB_EPISODES = "https://episodes.metahub.space";

	async createMetaPreview(scMeta, type) {
		return await this.createMeta(scMeta._source, type, scMeta._id)
	}

	async cinemataIfPossible(scMeta, type, alternative) {
		logger.log("cinemataIfPossible", type)
		const tmdbId = scMeta?.services?.tmdb
		const imdbId = scMeta?.services?.imdb
		const sccMeta = alternative()
		var alternativeMeta
		if(!alternativeMeta && tmdbId) {
			logger.log("using TMDB meta")
			alternativeMeta = await Addons.metaTmdb(type, tmdbId)
		}
		if (!alternativeMeta && imdbId) {
			logger.log("using Cinemata meta")
			alternativeMeta = await Addons.metaCinemata(type == helpers.STREMIO_TYPE.ANIME ? helpers.STREMIO_TYPE.SHOW : type, imdbId)
		} 
		if(!alternativeMeta){
			alternativeMeta = sccMeta
		}
		alternativeMeta.id = sccMeta.id
		alternativeMeta.name = sccMeta.name ? sccMeta.name : alternativeMeta.name
		alternativeMeta.description = sccMeta.description ? sccMeta.description : alternativeMeta.description
		logger.log("final meta", alternativeMeta)
		return alternativeMeta
	}

	async createMeta(data, type, id) {
		return await this.cinemataIfPossible(data, type, () => {
			id = helpers.getWithPrefix(id);
			const universalMeta = this.#createUniversalMeta(data)
			const ret = {
				id: id,
				type: type,
				name: universalMeta.name,
				poster: universalMeta.poster,
				description: universalMeta.description,
				cast: data.cast.slice(0, 3).map(it => it.name),
				director: universalMeta.label.director.slice(0, 1),
				genres: universalMeta.label.genre,
				imdbRating: universalMeta.imdbRating,
				runtime: universalMeta.runtime,
				releaseInfo: universalMeta.label.year,
				logo: universalMeta.imdbLogo,
				background: universalMeta.imdbBackground,
			};
			return ret
		})
	}

	async createMetaEpisode(showScMeta, scMeta) {
		return await this.cinemataIfPossible(scMeta._source, helpers.STREMIO_TYPE.SHOW, () => {
			const data = scMeta._source
			const universalShowMeta = this.#createUniversalMeta(showScMeta)
			const universalMeta = this.#createUniversalMeta(data)
			const premiere = new Date(universalMeta.label.premiered)
			const imdbLogo = universalShowMeta.imdbId ? `${this.META_HUB_EPISODES}/${universalShowMeta.imdbId}/${universalMeta.label.season}/${universalMeta.label.episode}/w780.jpg` : null
			premiere.setHours(23, 59, 59)
			const ret = {
				id: helpers.getWithPrefix(`${data.root_parent}:${universalMeta.label.season}:${universalMeta.label.episode}`),
				title: universalMeta.name || `Episode ${universalMeta.label.episode}`,
				season: universalMeta.label.season,
				episode: universalMeta.label.episode,
				overview: universalMeta.description,
				thumbnail: this.resolveImage(
					imdbLogo,
					universalMeta.translatedLabelEn?.art?.thumb,
					universalMeta.translatedLabelSk?.art?.thumb,
					universalMeta.translatedLabelEn?.art?.banner,
					universalMeta.translatedLabelSk?.art?.banner,
					universalShowMeta.poster,
				),
				released: premiere,
				available: data.stream_info !== undefined,
			}
			return ret
		})
	}

	#createUniversalMeta(data) {
		const imdbId = data?.services?.imdb
		const imdbLogo = imdbId ? `${this.META_HUB_IMAGES}/logo/medium/${imdbId}/img` : null
		const imdbPoster = imdbId ? `${this.META_HUB_IMAGES}/poster/medium/${imdbId}/img` : null
		const imdbBackground = imdbId ? `${this.META_HUB_IMAGES}/background/medium/${imdbId}/img` : null
		const label = data.info_labels
		const translatedLabelSk = data.i18n_info_labels[0]
		const translatedLabelEn = data.i18n_info_labels[2]
		const ret = {
			imdbId: imdbId,
			imdbLogo: imdbLogo,
			imdbPoster: imdbPoster,
			imdbBackground: imdbBackground,
			label: label,
			translatedLabelSk: translatedLabelSk,
			translatedLabelEn: translatedLabelEn,
			name: translatedLabelSk.title || translatedLabelEn.title,
			description: translatedLabelSk.plot || translatedLabelEn.plot,
			imdbRating: data?.ratings?.overall?.rating,
			runtime: (Math.round(label.duration / 60)) + " min",
			poster: this.resolveImage(
				translatedLabelSk.art?.poster,
				imdbPoster,
				translatedLabelSk.art?.fanart
			),
		};
		return ret
	}

	resolveImage() {
		for (const url of arguments) {
			const fixedUrl = this.#fixProtocol(url)
			if (fixedUrl) {
				return fixedUrl
			}
		}
		return undefined
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

module.exports = SccMeta