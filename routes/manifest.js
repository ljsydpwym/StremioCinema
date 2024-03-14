const Logger = require('../helpers/logger.js')
const {settingsLoader} = require('../helpers/settings.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')

const catalogs = require('../logic/catalogs.js')
const types = require('../logic/types.js')

const logger = new Logger("manifest", true)

function manifest(req, res) {
    const { type, id, token } = req.params
    const settings = settingsLoader(token)
    res.setHeader('Content-Type', 'application/json')
    res.send({
        id: env.PLUGIN_ID,
        version: '1.0.0',
        name: env.PLUGIN_NAME,
        description: "Add-on to hook into SCC and Webshare VIP search",
        resources: ['stream', 'catalog', {
            name: "meta",
            types: types.SUPPORTED_TYPES,
            idPrefix: [helpers.PREFIX],
        }],
        behaviorHints: {
            configurable: true,
            configurationRequired: !settings.token || settings.token.length == 0
        },
        catalogs: catalogs.catalogsManifest(settings),
        types: types.SUPPORTED_TYPES,
    })
}

module.exports = {
    manifest
}