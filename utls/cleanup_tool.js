/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const repeat = require('repeat');
const fs = require('fs');
const _ = require('underscore');
const Promise = require('bluebird');
const moment = require('moment');
const logger = require('./logger.js');


function parse_tags(Tags) {
    const app_name = _.chain(Tags)
        .find(x => {
            return x.Key === 'app_name';
        })
        .value()
        .Value;
    const version = _.chain(Tags)
        .find(x => {
            return x.Key === 'version';
        })
        .value()
        .Value;
    const stack_name = _.chain(Tags)
        .find(x => {
            return x.Key === 'aws:cloudformation:stack-name';
        })
        .value()
        .Value;
    const omit_list = [
        `ASG${app_name}${version}`,
        `LC${app_name}${version}`,
        `CPUH${app_name}${version}`,
        `CPUL${app_name}${version}`,
        `SPU${app_name}${version}`,
        `SPD${app_name}${version}`,
        `WC${app_name}${version}`
    ];

    return {
        stack_name: stack_name,
        omit_list: omit_list
    };
}

function remove_scale_group(params) {

    const config_client = require('../config/config.js');
    let cloudformation;

    return config_client.getDefaultAws()
        .then(response => {
            cloudformation = Promise.promisifyAll(new AWS.CloudFormation(response.aws));

            return cloudformation.getTemplateAsync({
                StackName: params.stack_name
            });
        })
        .then(response => {
            const template = JSON.parse(response.TemplateBody);
            template.Resources = _.omit(template.Resources, params.omit_list);
            return template;
        })
        .then(template => {
            return cloudformation.updateStackAsync({
                StackName: params.stack_name,
                TemplateBody: JSON.stringify(template)
            });
        })
        .then(() => {
            logger.info(`Removed items because of terminate_date tag ${params.omit_list}`);
        });
}

function check_scale_groups() {

    if (!fs.existsSync('secrets.json')) {
        logger.debug('Initial setup has not been completed (secrets.json missing)');
        return;
    }

    const config_client = require('../config/config.js');
    let autoscaling;

    logger.debug('Polling for stale scale-groups');
    return config_client.getDefaultAws()
        .then(response => {
            autoscaling = Promise.promisifyAll(new AWS.AutoScaling(response.aws));
            return autoscaling.describeAutoScalingGroupsAsync();
        })
        .then(response => {
            let omit_list = {};
            return Promise.map(response.AutoScalingGroups, scale_group => {
                    const date_string = _.chain(scale_group.Tags)
                        .find(x => {
                            return x.Key === 'terminate_date';
                        })
                        .value();

                    if (!date_string) {
                        return;
                    }

                    const term_date = moment(date_string.Value, 'YYYYMMDDHHmm');
                    if (moment() > term_date) {
                        return Promise.try((resolve, reject) => {
                                return parse_tags(scale_group.Tags);
                            })
                            .then(omit_obj => {
                                omit_list[omit_obj.stack_name] = _.union(omit_obj.omit_list, omit_list[omit_obj.stack_name]);
                            });
                    }
                })
                .then(() => {
                    return Promise.map(_.keys(omit_list), stack_name => {
                        const params = {
                            omit_list: omit_list[stack_name],
                            stack_name: stack_name
                        };
                        return remove_scale_group(params);
                    });
                });

        })
        .catch(err => {
            logger.error(err);
        });
}

function parse_tags(Tags) {
    const app_name = _.chain(Tags)
        .find(x => {
            return x.Key === 'app_name';
        })
        .value()
        .Value;
    const version = _.chain(Tags)
        .find(x => {
            return x.Key === 'version';
        })
        .value()
        .Value;
    const stack_name = _.chain(Tags)
        .find(x => {
            return x.Key === 'aws:cloudformation:stack-name';
        })
        .value()
        .Value;
    const omit_list = [
        `ASG${app_name}${version}`,
        `LC${app_name}${version}`,
        `CPUH${app_name}${version}`,
        `CPUL${app_name}${version}`,
        `SPU${app_name}${version}`,
        `SPD${app_name}${version}`,
        `WC${app_name}${version}`
    ];

    return {
        stack_name: stack_name,
        omit_list: omit_list
    };
}

function start_polling() {
    logger.info('Starting stack cleanup tool');
    repeat(check_scale_groups)
        .every(1, 'm')
        .start.in(Math.floor(Math.random() * 10) + 1, 'sec');
}


module.exports = start_polling();
