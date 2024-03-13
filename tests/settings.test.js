const {settingsLoader} = require('../settings.js')

describe('load settings with legacy token', () => {
    it('', () => {
        const settings = settingsLoader("dXNlcm5hbWU6cGFzc3dvcmQ=")
        expect(settings).toEqual({
            mainLang: "sk-SK",
            fallbackLang: "cs-CZ",
            additionalInfo: false,
            explicit: false,
            token: "dXNlcm5hbWU6cGFzc3dvcmQ="
        })
    })
})

describe('load settings with new object', () => {
    it('', () => {
        const settings = settingsLoader("%7B%22token%22%3A%22dXNlcm5hbWU6cGFzc3dvcmQ%3D%22%7D")
        expect(settings).toEqual({
            mainLang: "sk-SK",
            fallbackLang: "cs-CZ",
            additionalInfo: false,
            explicit: false,
            token: "dXNlcm5hbWU6cGFzc3dvcmQ="
        })
    })
})

describe('load settings with new object multiple fields', () => {
    it('', () => {
        const settings = settingsLoader("%7B%22token%22%3A%22dXNlcm5hbWU6cGFzc3dvcmQ%3D%22%2C%22mainLang%22%3A%22aa-AA%22%2C%22fallbackLang%22%3A%22bb-BB%22%2C%22additionalInfo%22%3Atrue%2C%22explicit%22%3A%20true%7D")
        expect(settings).toEqual({
            mainLang: "aa-AA",
            fallbackLang: "bb-BB",
            additionalInfo: true,
            explicit: true,
            token: "dXNlcm5hbWU6cGFzc3dvcmQ="
        })
    })
})

describe('is safe to call settingsLoader multiple times', () => {
    it('', () => {
        const settings = settingsLoader("%7B%22token%22%3A%22dXNlcm5hbWU6cGFzc3dvcmQ%3D%22%2C%22mainLang%22%3A%22aa-AA%22%2C%22fallbackLang%22%3A%22bb-BB%22%2C%22additionalInfo%22%3Atrue%2C%22explicit%22%3A%20true%7D")
        expect(settings).toEqual({
            mainLang: "aa-AA",
            fallbackLang: "bb-BB",
            additionalInfo: true,
            explicit: true,
            token: "dXNlcm5hbWU6cGFzc3dvcmQ="
        })
        const settings2 = settingsLoader(settings)
        expect(settings2).toEqual({
            mainLang: "aa-AA",
            fallbackLang: "bb-BB",
            additionalInfo: true,
            explicit: true,
            token: "dXNlcm5hbWU6cGFzc3dvcmQ="
        })

    })
})