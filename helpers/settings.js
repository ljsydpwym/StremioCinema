
function settingsLoader(input) {
    var params
    try {
        params = JSON.parse(decodeURIComponent(input))
    }
    catch (error) {
        params = input
    }
    //NEVER REMOVE OR REORGANIZE FIELDS - this will create issue with backward compatibility - ONLY ADD NEW
    return {
        tmdbEnabled: params?.tmdbEnabled ?? false,
        tmdbMainLang: params?.tmdbMainLang ?? "sk-SK",
        tmdbFallbackLang: params?.tmdbFallbackLang ?? "cs-CZ",
        allowExplicit: params?.allowExplicit ?? false,
        pageSize: params?.pageSize ?? 10,
        token: params?.token ?? params,
    }
}

module.exports = {
    settingsLoader
}