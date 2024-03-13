
function settingsLoader(input) {
    var params
    try {
        params = JSON.parse(decodeURIComponent(input))
    }
    catch (error) {
        params = input
    }
    return {
        mainLang: params.mainLang ?? "sk-SK",
        fallbackLang: params.fallbackLang ?? "cs-CZ",
        additionalInfo: params.additionalInfo ?? false,
        explicit: params.explicit ?? false,
        token: params.token ?? params,
    }
}

module.exports = {
    settingsLoader
}