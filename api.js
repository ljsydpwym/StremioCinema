const Logger = require('./logger.js')
const needle = require('needle');

const logger = new Logger("CALL", false)
const headers = {
	"user-agent": "Kodi/16.1 (Patched; Intel Something) App_Bitness/64 Version/17.6-Git:20171114-a9a7a20",
	"X-UuuId": "a9301413-b900-470d-9aaf-813758c66214"
};
async function call(method, url, data, options = {headers: headers} ) {
	logger.log("Api request", arguments)
	const response = await needle(method, url, data, options)
	logger.log("Api response", response.body)
	return response
}

module.exports = call