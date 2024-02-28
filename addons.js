const call = require('./api.js');

async function metaCinemata(itemType, itemImdbId) {
	return await metaAddon(`https://cinemeta-live.strem.io/meta/${itemType}/${itemImdbId}.json`)
}

async function metaTmdb(itemType, itemTmdbId) {
	return await metaAddon(`https://94c8cb9f702d-tmdb-addon.baby-beamup.club/%7B%22include_adult%22%3A%22true%22%2C%22language%22%3A%22sk-SK%22%7D/meta/${itemType}/tmdb:${itemTmdbId}.json`)
}

async function metaAddon(url) {
	const res = await call(`get`, url)
	const ret = res.body.meta
	return ret
}

module.exports = {
	metaCinemata,
	metaTmdb
}