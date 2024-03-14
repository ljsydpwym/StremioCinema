const path = require('path');

function configure(req, res) {
    res.sendFile(path.join(__dirname, '../www/configure.html'))
}
module.exports = {
    configure
}