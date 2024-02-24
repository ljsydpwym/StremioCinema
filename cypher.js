'use strict';

const crypto = require('crypto');
const env = require('./env.js');

function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', env.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
 }

 function decrypt(encryptedText) {
    const decipher = crypto.createDecipher('aes-256-cbc', env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
 }

 module.exports = {
    encrypt,
    decrypt,
}