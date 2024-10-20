require('dotenv').config()

const env = require('./helpers/env.js')
// const sentry = require('./helpers/sentry.js')
const cache = require('./helpers/cache.js')
const certs = require('./helpers/certs.js')

const {manifest} = require('./routes/manifest.js')
const {catalog} = require('./routes/catalog.js')
const {meta} = require('./routes/meta.js')
const {streams} = require('./routes/streams.js')
const {url} = require('./routes/url.js')
const {configure} = require('./routes/configure.js')

const express = require('express')
const cors = require('cors')
const app = express()

// sentry.init(app)

app.use(cors())

const port = env.PORT
const baseUrl = '/1/:token'

app.enable('trust proxy')
app.get(baseUrl + '/manifest.json', cache.caching(), manifest)
app.get('/manifest.json', cache.caching(), manifest)

app.get(baseUrl + '/catalog/:type/:id/:extra?.json', cache.caching(), catalog)
app.get(baseUrl + '/meta/:type/:id.json', cache.caching(), meta);

app.get(baseUrl + '/stream/:type/:id.json', streams)
app.get('/stream/url/:id.json', url)

app.get('/', configure)
app.get('/configure', configure)
app.get(baseUrl + '/configure', configure)

cache.initRoutes(app)

certs.start(app, port, env.HTTPS, function () {
    let base = `http${env.HTTPS ? "s" : ""}://127.0.0.1:${port}`
    console.log(`legacy token ${base}/1/${env.WS_TOKEN}/manifest.json`)
    console.log(`${base}/configure`)
    console.log(`${base}/manifest.json`)
})

module.exports = app