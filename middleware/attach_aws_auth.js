/*jshint esversion: 6 */
'use strict';

const crypto_client = require('../utls/crypto_client.js');
const logger = require('../utls/logger.js');

class AttachAwsAuth {
    constructor() {}

    run(req, res, next) {

        const config = require('../config/config.js');

        let aws_account = req.headers.aws_account || req.body.aws_account;
        let aws_region = req.headers.aws_region || req.body.aws_region;

        if (!aws_account) {
            logger.info('did not recieve a header for aws account:', req.url);
            return;
        } else if (!aws_region) {
            logger.info('did not recieve a header for aws region:', req.url);
            return;
        }

        let aws_object = {}

        return config.getServiceAccount({
                name: aws_account,
                type: 'AWS'
            })
            .then(response => {
                req.aws = response;
                req.aws_account = {
                    region: req.headers.aws_region,
                    accessKeyId: response.aws.accessKeyId,
                    secretAccessKey: response.aws.secretAccessKey
                };
                return next();
            });
    }
}

module.exports = new AttachAwsAuth();
