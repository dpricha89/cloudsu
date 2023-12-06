/*jshint esversion: 6 */
'use strict';

const logger = require('../../utls/logger.js');
const err_handler = require('../../utls/error_handler.js');

class Stacks {
    constructor() {}

    listStacks(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.listStacks()
            .then(stack_list => {
                res.status(200).json(stack_list);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    stack(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.stack(req.params.stack_name)
            .then(stack => {
                res.status(200).json(stack);
            })
            .catch(err => {
                logger.info(err);
                res.status(500).json(err_handler(err));
            });
    }

    stackStatus(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.stackStatus(req.params.stack_name)
            .then(status => {
                res.status(200).json(status);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    createStack(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        const params = req.body;
        params.cms = req.cms;
        params.aws = req.aws;

        return stacks_client.createStack(params)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    deleteStack(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        const params = {
            cms: req.cms,
            stack_name: req.params.stack_name
        };

        

        return stacks_client.deleteStack(params)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    describe(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.describe(req.params.stack_name)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    deleteAsg(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.deleteAsg(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    adjustSize(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.adjustSize(req.body)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    getTemplate(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.getTemplate(req.params.stack_name)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    updateStack(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);
        const params = req.body;

        return stacks_client.updateStack(params.template, params.stack_name)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    describeEvents(req, res) {

        let aws_account = req.aws_account;
        let stacks_client = require('../clients/stacks_client.js');
        stacks_client.init(aws_account);

        return stacks_client.describeEvents(req.params.stack_name)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }
}

module.exports = new Stacks();
