const SC_TOKEN = process.env.SC_TOKEN
const TMDB_TOKEN = process.env.TMDB_TOKEN
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const PLUGIN_ID = process.env.PLUGIN_ID || "com.ljsydpwym"
const PLUGIN_NAME = process.env.PLUGIN_NAME || "Stremio Cinema"
const DEBUG = process.env.DEBUG || false
const PORT = process.env.PORT || 4000
const SENTRY_DSN = process.env.SENTRY_DSN
const WS_TOKEN = process.env.WS_TOKEN || ":token"

module.exports = {
    SC_TOKEN,
    TMDB_TOKEN,
    ENCRYPTION_KEY,
    PLUGIN_ID,
    PLUGIN_NAME,
    DEBUG,
    PORT,
    SENTRY_DSN,
    WS_TOKEN
}