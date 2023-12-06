/*jshint esversion: 6 */
'use strict';

const logger = require('../../utls/logger.js');
const err_handler = require('../../utls/error_handler.js');

class Upgrade {
    constructor() {}

    full(req, res) {

        let params = req.body;
        params.aws_account = req.aws_account;
        params.cms = req.cms;
        params.aws = req.aws;

        const upgrade_client = require('../clients/upgrade_client.js');
        upgrade_client.init(params);

        return upgrade_client.full(params)
            .then(response => {
                res.status(200).json({ status: 'ok', message: 'Successfully started upgrade' });
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    stage1(req, res) {

        let params = req.body;
        params.aws_account = req.aws_account;
        params.cms = req.cms;
        params.aws = req.aws;

        const upgrade_client = require('../clients/upgrade_client.js');
        upgrade_client.init(params);

        return upgrade_client.stage1(params)
            .then(response => {
                res.status(200).json({ status: 'ok' });
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    stage2(req, res) {

        let params = req.body;
        params.aws_account = req.aws_account;
        params.cms = req.cms;
        params.aws = req.aws;

        const upgrade_client = require('../clients/upgrade_client.js');
        upgrade_client.init(params);

        return upgrade_client.stage2(params)
            .then(response => {
                res.status(200).json({ status: 'ok' });
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    stage3(req, res) {

        let params = req.body;
        params.aws_account = req.aws_account;
        params.cms = req.cms;
        params.aws = req.aws;

        const upgrade_client = require('../clients/upgrade_client.js');
        upgrade_client.init(params);

        return upgrade_client.stage3(params)
            .then(response => {
                res.status(200).json({ status: 'ok' });
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    stage4(req, res) {

        let params = req.body;
        params.aws_account = req.aws_account;
        params.cms = req.cms;
        params.aws = req.aws;

        const upgrade_client = require('../clients/upgrade_client.js');
        upgrade_client.init(params);

        return upgrade_client.stage4(params)
            .then(response => {
                res.status(200).json({ status: 'ok' });
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    rollback(req, res) {

        const params = req.body;
        params.aws_account = req.aws_account;
        params.cms = req.cms;
        params.aws = req.aws;


        const upgrade_client = require('../clients/upgrade_client.js');
        upgrade_client.init(params);

        return upgrade_client.rollback(params)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }
}

module.exports = new Upgrade();
