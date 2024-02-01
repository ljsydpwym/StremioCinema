class Logger{

    constructor(tag, enabled) {
        this.tag = tag + " "
        this.enabled = enabled
    }

    log(message, ...optionalParams){
//        if(this.enabled){
            console.log(this.tag + message, ...optionalParams)
//        }
    }

}

module.exports = Logger