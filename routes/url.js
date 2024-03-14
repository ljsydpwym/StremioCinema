const Logger = require('../helpers/logger.js')
const cypher = require('../helpers/cypher.js')

const logger = new Logger("url", true)

async function url(req, res) {
    logger.log("url", req.params)
    const { id } = req.params;
    const decrypted = cypher.decrypt(id)
    logger.log("decrypted", decrypted)
    res.redirect(decrypted)
}

module.exports = {
    url
}