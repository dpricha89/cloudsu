/*jshint esversion: 6 */
'use strict';

const _ = require('underscore');
const Promise = require('bluebird');
const path = require('path');
const SECURE_SETTINGS_FILE = '../secrets.json';
const secrets_file = path.resolve(__dirname, SECURE_SETTINGS_FILE);
const logger = require('../utls/logger.js');
const NodeCache = require('node-cache');
var client = new NodeCache({
    stdTTL: 3000,
    checkperiod: 150
});

class SecureConfig {
    constructor() {}

    get(key) {

        let value = client.get(key);

        if (value) {
            return value;
        }

        const nconf = require('nconf');

        nconf.file(SECURE_SETTINGS_FILE, {
            file: secrets_file,
            secure: {
                secret: 'gbXQ2y+8cpl63n&',
                alg: 'aes-256-ctr'
            }
        });

        value = nconf.get(key);
        if (_.isUndefined(value)) {
            logger.error(`Key not found: ${key}`);
            return false;
        }
        client.set(key, value);
        return value;
    }

    save(key, value) {

        return new Promise(function (resolve, reject) {

            const nconf = require('nconf');

            nconf.file(SECURE_SETTINGS_FILE, {
                file: secrets_file,
                secure: {
                    secret: 'gbXQ2y+8cpl63n&',
                    alg: 'aes-256-ctr'
                }
            });

            nconf.set(key, value);
            nconf.save(err => {
                if (err) {
                    logger.error(err.message);
                    return reject(err);
                }
                return resolve();
            });

        });
    }
}


module.exports = new SecureConfig();
