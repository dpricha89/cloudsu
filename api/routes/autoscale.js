/*jshint esversion: 6 */
'use strict';

const err_handler = require('../../utls/error_handler.js');
const logger = require('../../utls/logger.js');

class Autoscale {
    constructor() {}

    adjustSize(req, res) {

        const params = req.body;
        const aws_account = req.aws_account;
        const autoscale_client = require('../clients/autoscale_client.js');
        autoscale_client.init(aws_account);

        return autoscale_client.adjustSize(params)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }

    describeAutoScalingGroups(req, res) {

        const groups = req.params.groups.split(',');
        const aws_account = req.aws_account;
        const autoscale_client = require('../clients/autoscale_client.js');
        autoscale_client.init(aws_account);

        return autoscale_client.describeAutoScalingGroups(groups)
            .then(response => {
                res.status(200).json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });
    }
}


module.exports = new Autoscale();
