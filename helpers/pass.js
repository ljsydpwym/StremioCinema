const { createHash, randomBytes } = require('crypto');

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(password + salt).digest('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, hash) {
    const hashToVerify = createHash('sha256').update(password + salt).digest('hex');
    return hash === hashToVerify;
}

module.exports = {
    hashPassword,
    verifyPassword
};