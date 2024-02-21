class Config {
    constructor() {
        this.isDev = this.getArgs().includes('--dev');
    }

    getId() {
        return (this.isDev) ? "dev.com.ljsydpwym" : "com.ljsydpwym";
    }

    getName() {
        return (this.isDev) ? "dev_StremioCinema" : "StremioCinema";
    }

    getArgs() {
        return process.argv.slice(2);
    }
}

module.exports = Config;