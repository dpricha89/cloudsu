/*jshint esversion: 6 */
'use strict';

const _ = require('underscore');
const config = require('../../config/config.js');
const err_handler = require('../../utls/error_handler.js');
const logger = require('../../utls/logger.js');
const fs = require('fs');
const path = require('path');
const config_client = require('../../config/config.js');

class Main {
    constructor() {}

    region(req, res) {
        //return default region from global configs
        const region = 'us-west-2';
        res.status(200).json(region);
    }

    regions(req, res) {
        res.status(200).json([
            'us-east-1',
            'us-west-2',
            'us-west-1',
            'eu-west-1',
            'eu-central-1',
            'ap-southeast-1',
            'ap-northeast-1',
            'ap-southeast-2',
            'ap-northeast-2'
        ]);
    }

    regionMap(req, res) {

        //get az's in region
        const region = req.headers.aws_region;

        return config.get('region_map')
            .then(map => {
                res.status(200).json(map[region]);
            });

    }

    bucketRegions(req, res) {
        res.status(200).json([
            'us-east-1',
            'us-west-1',
            'us-west-2',
            'eu-west-1',
            'ap-southeast-1',
            'ap-southeast-2',
            'ap-northeast-1',
            'sa-east-1'
        ]);
    }

    listServerCertificates(req, res) {

        const aws_account = req.aws_account;
        const iam_client = require('../clients/iam_client.js');
        iam_client.init(aws_account);

        return iam_client.listServerCertificates()
            .then(certs => {
                res.status(200).json(certs);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    listInstanceProfiles(req, res) {

        const aws_account = req.aws_account;
        const iam_client = require('../clients/iam_client.js');
        iam_client.init(aws_account);

        return iam_client.listInstanceProfiles()
            .then(roles => {
                res.status(200).json(roles);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    deleteServiceAccount(req, res) {

        if (req.params.name === 'DEFAULT') {
            return res.status(403).json('Cannot delete DEFAULT service accounts');
        }

        //require clients
        const sns_client = require('../clients/sns_client.js');
        let user;

        return config_client.getServiceAccount(req.params)
            .then(response => {
                user = response;
                return config_client.getDefaultAws();
            })
            .then(response => {
                sns_client.init(response.aws);
                return sns_client.removePermission(user);
            })
            .then(response => {
                return config.deleteServiceAccount(user);
            })
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    saveServiceAccount(req, res) {

        let params = _.clone(req.body);

        //require clients
        const iam_client = require('../clients/iam_client.js');
        const sns_client = require('../clients/sns_client.js');

        //init client
        iam_client.init({
            accessKeyId: params.key,
            secretAccessKey: params.secret
        });

        return iam_client.getAccountId(params)
            .then(AccountId => {
                params.AccountId = AccountId;
                req.body.AccountId = AccountId;
                return config_client.query({
                    name: 'DEFAULT',
                    type: 'TOPIC'
                });
            })
            .then(topic => {
                params.TopicArn = topic.arn;
                req.body.TopicArn = topic.arn;
                return config_client.getDefaultAws();
            })
            .then(response => {
                sns_client.init(response.aws);
                return sns_client.addPermission(params);
            })
            .then(() => {
                return config.saveServiceAccount(req.body);
            })
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }

    getServiceAccount(req, res) {

        return config.getServiceAccount(req.params)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    getServiceAccounts(req, res) {

        if (!req.user.admin) {
            return res.status(403).json('User is not apart of the admin group');
        }

        return config.getServiceAccounts(req.params.type)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    getServiceList(req, res) {

        return config.getServiceAccounts('AWS')
            .then(response => {
                res.status(200).json(_.pluck(response, 'name'));
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    exportConfig(req, res) {

        logger.info('Exporting config');
        const obj = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../secrets.json'), 'utf8'));

        if (obj) {
            return res.status(200).json(obj);
        }

        logger.error('Config file not found');
        res.status(500).json('File not found');
    }

    importConfig(req, res) {
        logger.info('Importing config');

        if (!req.body) {
            return req.status(500).json('Request body is empty');
        }

        fs.writeFile(path.resolve(__dirname, '../../secrets.json'), JSON.stringify(req.body), function (err) {
            if (err) {
                return req.status(500).json('Error writing config to disk');
            }
            res.status(200).json('Successfully imported config');
        });

    }
}
module.exports = new Main();
