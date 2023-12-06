/*jshint esversion: 6 */
'use strict';

const err_handler = require('../../utls/error_handler.js');
const logger = require('../../utls/logger.js');

class Sqs {
    constructor() {}

    createQueue(req, res) {

        const aws_account = req.params.aws_account;
        const sqs_client = require('../clients/sqs_client.js');
        sqs_client.init(aws_account);

        return sqs_client.createQueue(req.params.QueueName)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    initialSetup(req, res) {

        const aws_account = req.aws_account;
        const sqs_client = require('../clients/sqs_client.js');
        sqs_client.init(aws_account);

        return sqs_client.initialSetup()
            .then(() => {
                res.status(200).json('successful creation');
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }
}

module.exports = new Sqs();
