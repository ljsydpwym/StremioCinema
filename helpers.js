function format(value) {
    return value ? value.trim().toUpperCase() : ''
}

function formatAudio(value) {
    return `${format(value.language)} [${format(value.codec)} ${formatChannel(value.channels)}]`
}

function formatChannel(value){
    switch(value){
        case 6: return "5.1"
        case 8: return "7.1"
        default: return value.toFixed(1)
    }
}

function formatBitrate(stream){
   return convert_bitrate(stream.size / stream.video[0].duration * 8)
}

function convert_bitrate(mbit) {
    if (mbit == 0 || mbit == null) {
        return 0;
    }
    var p = Math.pow(1024, 2);
    var s = mbit / p;
    return s.toFixed(2) + " Mbit/s"
}

const delay = 0.9

function formatHeight(value) {
    if (value < 480 * delay) return "low"
    if (value < 720 * delay) return "SD"
    if (value < 1080 * delay) return "HD"
    if (value < 1440 * delay) return "FullHD"
    if (value < 2160 * delay) return "QHD"
    if (value < 4320 * delay) return "4K"
    return "8K"
}

const HDR_FORMAT_HDR_1 = "SMPTE ST 2086"
const HDR_FORMAT_HDR_2 = "SMPTE ST 2094"
const HDR_FORMAT_DV = "Dolby Vision"

function is_hdr_value_dv(hdr){
    return hdr && (hdr || hdr?.includes(HDR_FORMAT_DV))
}

function is_hdr_value_dv_hdr(hdr){
    return hdr && (hdr || hdr?.includes(HDR_FORMAT_HDR_1) || hdr?.includes(HDR_FORMAT_HDR_2))
}

function formatHDR(hdrString, codec, is3D) {
    const isDV = is_hdr_value_dv(hdrString)
    const isHDR = is_hdr_value_dv_hdr(hdrString)
    var list = []
    if(isDV)
        list.push("DV")    
    if(isHDR)
        list.push("HDR")
    if(is3D)
        list.push("3D")
    if(codec)
        list.push(`${codec}`)
    return list.length > 0 ? `[${list.join(",")}]` : ""
}

function bytesToSize(bytes){
    if      (bytes >= 1024*1024*1024) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; }
    else if (bytes >= 1024*1024)      { bytes = (bytes / 1048576).toFixed(0) + " MB"; }
    else if (bytes >= 1024)           { bytes = (bytes / 1024).toFixed(0) + " KB"; }
    else if (bytes > 1)               { bytes = bytes + " bytes"; }
    else if (bytes == 1)              { bytes = bytes + " byte"; }
    else                              { bytes = "0 bytes"; }
    return bytes;
  }

function pad(value) {
    return value.length == 1 ? "0" + value : value
}

const PREFIX = "scc_"

const STREMIO_TYPE = {
    MOVIE: "movie",
    SHOW: "series",
    ANIME: "anime",
}
const SCC_TYPE = {
    ANY: "*",
    MOVIE: "movie",
    SHOW: "tvshow",
    ANIME: "anime",
}

function startWithPrefix(id) {
    return id.startsWith("scc")
}
function getWithPrefix(id) {
    return id.startsWith(PREFIX) ? id : `${PREFIX}${id}`
}

function getWithoutPrefix(id) {
    return id.replace(PREFIX, "")
}

function queries(queries) {
    return Object.keys(queries).map(key => `${key}=${queries[key]}`).join("&")
}

const call = require('./api.js');

async function metaCinemata(itemType, itemImdbId) {
	return await metaAddon(`https://cinemeta-live.strem.io/meta/${itemType}/${itemImdbId}.json`)
}

async function metaTmdb(itemType, itemTmdbId, language) {
	return await metaAddon(`https://94c8cb9f702d-tmdb-addon.baby-beamup.club/%7B%22include_adult%22%3A%22true%22%2C%22language%22%3A%22${language}%22%7D/meta/${itemType}/tmdb:${itemTmdbId}.json`)
}

async function metaAddon(url) {
	const res = await call(`get`, url)
	const ret = res.body.meta
	return ret
}

module.exports = {
    format,
    formatHeight,
    bytesToSize,
    pad,
    startWithPrefix,
    getWithPrefix,
    getWithoutPrefix,
    queries,
    formatHDR,
    PREFIX,
    STREMIO_TYPE,
    SCC_TYPE,
    metaCinemata,
    metaTmdb,
    formatAudio,
    formatBitrate,
}