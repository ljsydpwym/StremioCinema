const path = require('path');
const express = require('express');
const Logger = require('../helpers/logger.js');
const settings = require('../helpers/settings.js');

const logger = new Logger("CONFIGURE", true);
const router = express.Router();

router.get('/configure', (req, res) => {
    try {
        const configPath = path.join(__dirname, '..', 'configure.html');
        res.sendFile(configPath);
    } catch (error) {
        logger.error(`Error loading configuration page: ${error.message}`);
        res.status(500).send({ error: error.message });
    }
});

router.post('/configure', (req, res) => {
    try {
        const newSettings = req.body;
        settings.saveSettings(newSettings);
        res.status(200).send({ message: 'Settings saved successfully' });
    } catch (error) {
        logger.error(`Error saving settings: ${error.message}`);
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;