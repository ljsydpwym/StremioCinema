function format(value) {
    return value.trim().toUpperCase()
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

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function pad(value) {
    return value.length == 1 ? "0" + value : value
}

module.exports = {
    format,
    formatHeight,
    bytesToSize,
    pad
}