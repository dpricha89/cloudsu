/*jshint esversion: 6 */
'use strict';


function db() {
    const secure = require('../config/secure_config');

    if (!secure) {
        return;
    }

    //get database creds from config
    const db_cred = secure.get('db');
    const dynasty = require('dynasty')({
        accessKeyId: db_cred.AccessKeyId,
        secretAccessKey: db_cred.SecretAccessKey,
        region: db_cred.region
    });
    const logger = require('./logger.js');

    logger.debug(`setup DynamoDB config connection: ${db_cred.region}`);

    //setup table connection
    return dynasty.table('cloudsu_config');

}

module.exports = new db();
