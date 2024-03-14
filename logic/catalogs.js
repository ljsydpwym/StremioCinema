const helpers = require('../helpers/helpers.js')
const {settingsLoader} = require('../helpers/settings.js')

const types = require('./types.js')

function catalogsManifest(params) {
    const settings = settingsLoader(params)
    return settings.catalogTypes.flatMap(type => {
        return types.CATALOGS.filter(it => settings.catalogs.includes(it.key)).map(catalog => {
            var extraSupported = []
            var extras = []
            if (catalog.search == true) {
                extras.push({ name: "search", isRequired: true })
                extraSupported.push("search")
            }
            var generatedGenres = undefined
            if (catalog.genres == true) {
                generatedGenres = types.GENRES
                    .filter(it => explicit || !it.explicit)
                    .map(it => it.name)
                extras.push({
                    name: "genre", 
                    isRequired: true, 
                    options: generatedGenres
                })
                extraSupported.push("genre")
            }
            extras.push({ name: "skip", isRequired: false })
            extraSupported.push("skip")
            const ret = {
                type: type,
                id: `scc_${catalog.key}`,
                name: `${catalog.name}`,
                extra: extras
            }
            if (generatedGenres) {
                ret.genres = generatedGenres
            }
            ret.extraSupported = extraSupported
            return ret
        })
    })
}

module.exports = {
    catalogsManifest,
}