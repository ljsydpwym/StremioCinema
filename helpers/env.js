function toBoolean(value, def) {
    if (value === undefined || value === null) {
        return def;
    }
    return value.toString().toLowerCase() === 'true';
}

function getEnvVar(name, defaultValue = null) {
    const value = process.env[name];
    if (value === undefined || value === null) {
        if (defaultValue !== null) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
}

const SC_TOKEN = getEnvVar('SC_TOKEN');
const TMDB_TOKEN = process.env.TMDB_TOKEN
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const PLUGIN_ID = process.env.PLUGIN_ID || "com.ljsydpwym"
const PLUGIN_NAME = process.env.PLUGIN_NAME || "Stremio Cinema"
const DEBUG = toBoolean(process.env.DEBUG, false)
const CACHE = toBoolean(process.env.CACHE, true)
const PORT = getEnvVar('PORT', 3000);
const SENTRY_DSN = process.env.SENTRY_DSN
const WS_TOKEN = getEnvVar('WS_TOKEN');
const HTTPS = toBoolean(getEnvVar('HTTPS', 'false'));
const VERSION = "1.0.1"

module.exports = {
    SC_TOKEN,
    TMDB_TOKEN,
    ENCRYPTION_KEY,
    PLUGIN_ID,
    PLUGIN_NAME,
    DEBUG,
    PORT,
    SENTRY_DSN,
    WS_TOKEN,
    CACHE,
    HTTPS,
    VERSION,
    toBoolean,
    getEnvVar
}