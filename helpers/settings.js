
const types = require('../logic/types.js')

function settingsLoader(input) {
    var params
    try {
        params = JSON.parse(decodeURIComponent(input))
    }
    catch (error) {
        params = input
    }
    //NEVER REMOVE FIELDS - this will create issue with backward compatibility - ONLY ADD NEW
    return {
        tmdbEnabled: params?.tmdbEnabled ?? false,
        tmdbMainLang: params?.tmdbMainLang ?? "sk-SK",
        tmdbFallbackLang: params?.tmdbFallbackLang ?? "cs-CZ",
        allowExplicit: params?.allowExplicit ?? false,
        pageSize: params?.pageSize ?? 10,
        showBitrate: params?.showBitrate ?? true,
        showDuration: params?.showDuration ?? false,
        showVideoExtra: params?.showVideoExtra ?? true,
        showAudioExtra: params?.showAudioExtra ?? false,
        catalogTypes: params?.catalogTypes ?? [types.STREMIO_TYPE.MOVIE, types.STREMIO_TYPE.SHOW, types.STREMIO_TYPE.ANIME],
        catalogs: params?.catalogs ?? [types.CATALOG_KEYS.trending, types.CATALOG_KEYS.popular, types.CATALOG_KEYS.most_watched, types.CATALOG_KEYS.new_releases, types.CATALOG_KEYS.new_releases_dubbed, types.CATALOG_KEYS.new_releases_subs, types.CATALOG_KEYS.last_added, types.CATALOG_KEYS.genre],
        token: params?.token ?? params,
    }
}

module.exports = {
    settingsLoader
}