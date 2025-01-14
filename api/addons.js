const call = require('./api.js');

async function metaCinemata(itemType, itemImdbId) {
    return await metaAddon(`https://cinemeta-live.strem.io/meta/${itemType}/${itemImdbId}.json`);
}

async function metaTmdb(itemType, itemTmdbId, language) {
    return await metaAddon(`https://94c8cb9f702d-tmdb-addon.baby-beamup.club/%7B%22include_adult%22%3A%22true%22%2C%22language%22%3A%22${language}%22%7D/meta/${itemType}/tmdb:${itemTmdbId}.json`);
}

async function metaWebshare(itemType, itemId) {
    return await metaAddon(`https://webshare.cz/api/meta/${itemType}/${itemId}.json`);
}

async function metaAddon(url) {
    const res = await call('get', url);
    if (res.statusCode === 200 && res.body && res.body.meta) {
        return res.body.meta;
    } else {
        throw new Error(`Failed to fetch metadata from ${url}`);
    }
}

module.exports = {
    metaCinemata,
    metaTmdb,
    metaWebshare,
};