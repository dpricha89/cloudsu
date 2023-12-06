/*jshint esversion: 6 */
'use strict';

const logger = require('../../utls/logger.js');
const err_handler = require('../../utls/error_handler.js');


class Ec2 {
    constructor() {}

    sizes(req, res) {

        const config = require('../../config/config.js');

        return config.get('aws_default_size_available')
            .then(size_array => {
                res.status(200)
                    .json(size_array);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    instances(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);
        const instance_array = req.params.instances.split(',');

        return ec2_client.instances(instance_array)
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    sampleImages(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);

        return ec2_client.sampleImages(aws_account.region)
            .then(images => {
                res.status(200)
                    .json(images);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    instancesByStack(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);

        return ec2_client.instancesByStack(req.params.stack_name)
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });

    }

    describeKeyPairs(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);

        return ec2_client.describeKeyPairs()
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    describeImages(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);

        return ec2_client.describeImages()
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    instanceStoreMap(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);

        return ec2_client.instanceStoreMap()
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    describeSecurityGroups(req, res) {

        const aws_account = req.aws_account;
        const ec2_client = require('../clients/ec2_client.js');
        ec2_client.init(aws_account);

        return ec2_client.describeSecurityGroups()
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });

    }
}


module.exports = new Ec2();
