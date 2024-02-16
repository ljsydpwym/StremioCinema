const Logger = require('./logger.js')

const call = require('./api')
const crypto = require('crypto')
const md5crypt = require('./crypt')
const getPass = require("./pass");

const logger = new Logger("Webshare", false)
const baseUrl = "https://webshare.cz"

function sha1(value) {
    return crypto.createHash('sha1').update(value).digest('hex')
}

class Webshare {

    headers = {
        headers: {
            "Host": "webshare.cz",
            "Accept": "text/xml; charset=UTF-8",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }
    }

    /**
     *Authenticate a user.
     *
     *@param username_or_email string The username or email address of the user.
     *@param password string The user's password digest SHA1(MD5_CRYPT(password)).
     *@param keep_logged_in int Tells whether to keep the user authenticated for a longer period of time (0 -> No, 1 -> Yes).
     */
    constructor() {
    }

    passwords = new Map()

    async loginIfNeeded(encodedToken) {
        logger.log("md5 map", this.md5Value)
        logger.log("encodedToken", encodedToken)
        this.md5Value = this.passwords[encodedToken]
        logger.log("md5 from map", this.md5Value)
        if (this.md5Value === undefined) {
            const token = new Buffer(encodedToken, 'base64').toString('ascii')
            logger.log("obtained new token", token)
            const data = token.split(":")
            const username = data[0]
            const password = data[1]
            const tokens = await this.login(username, password, 0)
            this.passwords[encodedToken] = tokens
            this.md5Value = tokens.md5Value
            this.token = tokens.token
        }
    }

    /**
     *Authenticate a user and store token in memory.
     *@return A session security token (WST).
     */
    async login(username_or_email, password, keep_logged_in) {
        const saltValue = await this.salt(username_or_email)
        const md5Value = md5crypt(password, saltValue)
        const sha1Value = sha1(md5Value)
        const token = (await call(`post`, `${baseUrl}/api/login/`,
            {
                username_or_email: username_or_email,
                password: sha1Value,
                keep_logged_in: keep_logged_in,
            },
            this.headers
        )).body.children[1].value
        const ret = {
            md5Value: md5Value,
            token: token
        }
        logger.log("login", ret)
        return ret
    }
    /**
     *Authenticate a user and store token in memory.
     *@return A session security token (WST).
     */
    async salt(username_or_email) {
        const ret = (await call(`post`, `${baseUrl}/api/salt/`,
            {
                username_or_email: username_or_email,
            },
            this.headers
        )).body.children[1].value
        logger.log("salt", arguments, ret)
        return ret
    }

    /**
     *
     *Search files.
     *
     *@param what string The text to be searched within file names.
     *@param category string [optional] The category of searched files (video, images, audio, docs, archives).
     *@param sort string [optional] How the search results should be sorted (recent, rating, largest, smallest).
     *@param limit int [optional] The maximum of the number of found files.
     *@param offset int [optional] The search results offset.
     *
     *@return The list of found files.
     */
    async search(what, category = "video", sort, limit = 20, offset = 0) {
        const ret = (await call(`post`, `${baseUrl}/api/search/`,
            `what=${what}&sort=${sort}&limit=${limit}&offset=${offset}&category=${category}&wst=${this.token}`,
            this.headers
        )).body
        logger.log("search", arguments, ret)
        return ret
    }

    async file_link_salt(ident) {
        const ret = (await call(`post`, `${baseUrl}/api/file_password_salt/`,
            `ident=${ident}&wst=${this.token}`,
            this.headers
        )).body.children[1].value
        logger.log("file_link_salt", arguments, ret)
        return ret
    }

    async file_protected(ident) {
        const ret = (await call(`post`, `${baseUrl}/api/file_protected/`,
            `ident=${ident}&wst=${this.token}`,
            this.headers
        )).body.children[1].value
        logger.log("file_protected", arguments, ret)
        return ret
    }

    async file_link(ident, original, download_type, device_uuid, device_vendor, device_model, device_res_x, device_res_y, force_https) {
        const isProtected = await this.file_protected(ident)
        var passwordPart = ""
        if(isProtected == 1){
            const saltValue = await this.file_link_salt(ident)
            logger.log("file_link saltValue", saltValue)
            logger.log("file_link Object['keys']", Object['keys'](original))
            const pass = getPass({
                audioCodec:"",
                duration:"",
                hdr:"",
                height:"",
                ident:original.ident,
                is3d:"",
                language:"",
                media:"",
                name:original.name,
            })
            logger.log("file_link pass", pass)
            const md5Value = md5crypt(pass, saltValue)
            logger.log("file_link md5Value", md5Value)
            const sha1Value = sha1(md5Value)
            logger.log("file_link sha1Value", sha1Value)
            passwordPart = `&password=${sha1Value}`
            logger.log("file_link passwordPart", passwordPart)
        }
        const ret = (await call(`post`, `${baseUrl}/api/file_link/`,
            `ident=${ident}${passwordPart}&download_type=${download_type}&device_uuid=${device_uuid}&device_vendor=${device_vendor}&device_model=${device_model}&device_res_x=${device_res_x}&device_res_y=${device_res_y}&force_https=${force_https}&wst=${this.token}`,
            this.headers
        )).body.children[1].value
        logger.log("file_link", arguments, ret)
        return ret
    }

    xmlToObject(arr) {
        var obj = {};
        for (var i = 0; i < arr.length; i++) {
            const tag = arr[i]
            obj[tag.name] = tag.children.length > 0 ? this.xmlToObject(tag.children) : tag.value;
        }
        return obj;
    }

}

module.exports = Webshare