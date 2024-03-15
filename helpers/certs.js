const fs = require("fs");
const https = require("https");
const Logger = require('../helpers/logger.js');

const logger = new Logger("certs", false)

function start(app, port, isHttps, listener){
    logger.log(`start on port:${port} with https:${isHttps}`)
    try{
        if(isHttps == true){
            const key = fs.readFileSync("certs/key.pem", "utf-8");
            const cert = fs.readFileSync("certs/cert.pem", "utf-8");
            https.createServer({ key, cert }, app).listen(port, listener);
        }else{
            app.listen(port, listener)
        }
    }catch(e){
        logger.logError("HTTPS failed, fallbacking to http")
        app.listen(port, listener)
    }
}

module.exports = {
    start
}