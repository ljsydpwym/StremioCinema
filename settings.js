
function settingsLoader(input) {
    var params
    try {
        params = JSON.parse(decodeURIComponent(input))
    }
    catch (error) {
        params = input
    }
    return {
        tmdb: {
            enabled: params?.loadTmdb ?? false,
            mainLang: params?.mainLang ?? "sk-SK",
            fallbackLang: params?.fallbackLang ?? "cs-CZ",
        },
        allowExplicit: params?.explicit ?? false,
        pageSize: params?.pageSize ?? 30,
        token: params?.token ?? params,
    }
}

module.exports = {
    settingsLoader
}