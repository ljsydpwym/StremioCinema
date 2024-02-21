const Logger = require('./logger.js')
const call = require('./api.js');
const crypto = require('crypto')
const md5crypt = require('./crypt.js')
const getPass = require("./pass.js");
const helpers = require('./helpers.js')

const logger = new Logger("Webshare", false)

class Webshare {

    passwords = new Map()

	constructor(){}
    
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

    async login(username_or_email, password, keep_logged_in) {
        const saltValue = await this.salt(username_or_email)
        const md5Value = md5crypt(password, saltValue)
        const sha1Value = sha1(md5Value)
        const token = (await callInternal(
            `/api/login/`, {
            username_or_email: username_or_email,
            password: sha1Value,
            keep_logged_in: keep_logged_in,
        })).children[1].value
        const ret = {
            md5Value: md5Value,
            token: token
        }
        logger.log("login", ret)
        return ret
    }

    async salt(username_or_email) {
        return (await callInternal(
            `/api/salt/`, {
            username_or_email: username_or_email,
        })).children[1].value
    }

    async search(what, category = "video", sort, limit = 20, offset = 0) {
        return (await callInternal(
            `/api/search/`, {
            what: what,
            sort: sort,
            limit: limit,
            offset: offset,
            category: category,
            wst: this.token,
        })).children[1].value
    }

    async file_link_salt(ident) {
        return (await callInternal(
            `/api/file_password_salt/`, {
            ident: ident,
            wst: this.token,
        })).children[1].value
    }

    async file_protected(ident) {
        return (await callInternal(
            `/api/file_protected/`, {
            ident: ident,
            wst: this.token,
        })).children[1].value
    }

    async file_link(ident, original, download_type, device_uuid, device_vendor, device_model, device_res_x, device_res_y, force_https) {
        const isProtected = await this.file_protected(ident)
        var passwordPart = ""
        if (isProtected == 1) {
            const saltValue = await this.file_link_salt(ident)
            logger.log("file_link saltValue", saltValue)
            logger.log("file_link Object['keys']", Object['keys'](original))
            const pass = getPass({
                audioCodec: "",
                duration: "",
                hdr: "",
                height: "",
                ident: original.ident,
                is3d: "",
                language: "",
                media: "",
                name: original.name,
            })
            logger.log("file_link pass", pass)
            const md5Value = md5crypt(pass, saltValue)
            logger.log("file_link md5Value", md5Value)
            const sha1Value = sha1(md5Value)
            logger.log("file_link sha1Value", sha1Value)
            passwordPart = sha1Value
            logger.log("file_link passwordPart", passwordPart)
        }
        const ret = (await callInternal(
            `/api/file_link/`, {
            ident: ident,
            password: passwordPart,
            download_type: download_type,
            device_uuid: device_uuid,
            device_vendor: device_vendor,
            device_model: device_model,
            device_res_x: device_res_x,
            device_res_y: device_res_y,
            force_https: force_https,
            wst: this.token,
        })).children[1].value
        logger.log("file_link", arguments, ret)
        return ret
    }

}

async function callInternal(path, params = {}) {
    const queries = helpers.queries(params)
    return (await call(
        `post`,
        `https://webshare.cz${path}`,
        queries,
        {
            headers: {
                "Host": "webshare.cz",
                "Accept": "text/xml; charset=UTF-8",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            }
        }
    )).body
}

function sha1(value) {
    return crypto.createHash('sha1').update(value).digest('hex')
}

module.exports = Webshare