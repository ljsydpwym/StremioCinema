const { createHash } = require('crypto');

function getPass(stream) {
    var keys = Object['keys'](stream).sort();
    return createHash('sha256').update(stream[keys[0x8]] + stream[keys[0x4]]).digest('hex');
}

module.exports = getPass;