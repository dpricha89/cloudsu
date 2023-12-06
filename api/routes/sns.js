/*jshint esversion: 6 */
'use strict';

const err_handler = require('../../utls/error_handler.js');
const logger = require('../../utls/logger.js');

class Sns {
    constructor() {}

    createTopic(req, res) {

        const aws_account = req.params.aws_account;
        const sns_client = require('../clients/sns_client.js');
        sns_client.init(aws_account);

        return sns_client.createTopic(req.params.topic_name)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    confirmSubscription(req, res) {

        const aws_account = req.aws_account;
        const sns_client = require('../clients/sns_client.js');
        sns_client.init(aws_account);

        return sns_client.confirmSubscription(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    subscribe(req, res) {

        const aws_account = req.aws_account;
        const sns_client = require('../clients/sns_client.js');
        sns_client.init(aws_account);

        return sns_client.subscribe(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }
}

module.exports = new Sns();
