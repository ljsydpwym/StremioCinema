const path = require('path');
const {buildHtml} = require('../www/buildHtml.js');

function configureOld(req, res) {
    res.sendFile(path.join(__dirname, '../www/configure.html'))
}

function configure(req, res) {
    res.setHeader('Content-Type', 'text/html')
    res.send(buildHtml())
}

module.exports = {
    configure
}