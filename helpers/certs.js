const fs = require("fs");
const https = require("https");
const path = require("path");
const env = require("./env.js");
const Logger = require("./logger.js");

const logger = new Logger("CERTS", true);

function loadCert(filePath) {
    try {
        return fs.readFileSync(filePath);
    } catch (error) {
        logger.error(`Error loading certificate from ${filePath}: ${error.message}`);
        throw error;
    }
}

function start(app, port, useHttps, callback) {
    if (useHttps) {
        const certOptions = {
            key: loadCert(path.join(__dirname, "..", "certs", "key.pem")),
            cert: loadCert(path.join(__dirname, "..", "certs", "cert.pem")),
        };
        https.createServer(certOptions, app).listen(port, callback);
    } else {
        app.listen(port, callback);
    }
}

module.exports = {
    start,
};