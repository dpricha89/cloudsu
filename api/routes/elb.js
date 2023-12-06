/*jshint esversion: 6 */
'use strict';

const logger = require('../../utls/logger.js');
const err_handler = require('../../utls/error_handler.js');

class Elb {
    constructor() {}

    connectElbs(req, res) {

        const aws_account = req.aws_account;
        const elb_client = require('../clients/elb_client.js');
        elb_client.init(aws_account);

        return elb_client.connectElb(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    disconnectElbs(req, res) {

        const aws_account = req.aws_account;
        const elb_client = require('../clients/elb_client.js');
        elb_client.init(aws_account);

        return elb_client.disconnectElb(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    connectElb(req, res) {

        const aws_account = req.aws_account;
        const elb_client = require('../clients/elb_client.js');
        elb_client.init(aws_account);

        return elb_client.connectElb(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    disconnectElb(req, res) {

        const aws_account = req.aws_account;
        const elb_client = require('../clients/elb_client.js');
        elb_client.init(aws_account);

        return elb_client.disconnectElb(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    getAvailableElbs(req, res) {

        const aws_account = req.aws_account;
        const elb_client = require('../clients/elb_client.js');
        elb_client.init(aws_account);

        return elb_client.getAvailableElbs(req.params.stack_name)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    getElbs(req, res) {

        const aws_account = req.aws_account;
        const elb_client = require('../clients/elb_client.js');
        elb_client.init(aws_account);

        const elb_array = req.params.elbs.split(',');

        return elb_client.getElbs(elb_array)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }
}


module.exports = new Elb();
