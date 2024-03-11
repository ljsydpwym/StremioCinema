
function loadSettings(params){
    return {
        mainLang: params.mainLang ?? "sk-SK",
        fallbackLang: params.fallbackLang ?? "cs-CZ",
        additionalInfo: params.additionalInfo ?? false,
        explicit: params.explicit ?? false,
    }
}

module.exports = {
    loadSettings
}