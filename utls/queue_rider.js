/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const repeat = require('repeat');
const fs = require('fs');
const logger = require('./logger.js');
const chef_client = require('../api/clients/chef_client.js');


function shutdown(message) {

    const config_client = require('../config/config.js');
    const servers_db = require('./servers_db.js');
    let group_name = message.AutoScalingGroupName.split('-');
    let node_name = [group_name[0], group_name[1], message.EC2InstanceId].join('-');
    logger.info(`Terminating instance: ${node_name}`);

    return config_client.getServiceAccount({
            name: 'DEFAULT',
            type: 'CMS'
        })
        .then(account => {
            chef_client.init(account);
            chef_client.deleteNode(node_name);
            return servers_db.remove(message.EC2InstanceId);
        });
}

function startup(message) {

    const config_client = require('../config/config.js');
    const servers_db = require('./servers_db.js');
    let group_name = message.AutoScalingGroupName.split('-');
    let node_name = [group_name[0], group_name[1], message.EC2InstanceId].join('-');

    var client_body = {
        'name': node_name,
        'admin': false,
        'create_key': true
    };
    var chef_url;

    logger.debug(`Launching instance: ${node_name}`);


    return config_client.getServiceAccount({
            name: 'DEFAULT',
            type: 'CMS'
        })
        .then(account => {
            chef_url = account.url;
            chef_client.init(account);
            return chef_client.createClient(client_body);
        })
        .then(response => {
            if (response.error) {
                logger.error(response.error);
                return;
            }

            const server = {
                instance_id: message.EC2InstanceId,
                key: response.private_key,
                node_name: node_name,
                chef_url: chef_url,
                environment: group_name[0]
            };
            return servers_db.insert(server);
        });
}

function parseMessages(messages, sqs_url) {

    return Promise.map(messages, function (message_body) {

        const sqs_client = require('../api/clients/sqs_client.js');
        let handle = message_body.ReceiptHandle;
        let body = JSON.parse(message_body.Body);
        let message = JSON.parse(body.Message);

        if (message.Event === 'autoscaling:EC2_INSTANCE_TERMINATE') {

            return sqs_client.deleteMessage({
                    QueueUrl: sqs_url,
                    ReceiptHandle: handle
                })
                .then(response => {
                    return shutdown(message);
                });

        } else if (message.Event === 'autoscaling:EC2_INSTANCE_LAUNCH') {

            return sqs_client.deleteMessage({
                    QueueUrl: sqs_url,
                    ReceiptHandle: handle
                })
                .then(response => {
                    return startup(message);
                });

        } else {

            return sqs_client.deleteMessage({
                    QueueUrl: sqs_url,
                    ReceiptHandle: handle
                })
                .then(response => {
                    logger.debug(`Unrecognized message event: ${message.Event}`);
                });
        }

    });
}

var poll = function () {

    if (!fs.existsSync('secrets.json')) {
        logger.debug('Initial setup has not been completed (secrets.json missing)');
        return;
    }

    // needs to be assigned inside the repeating function
    // because of cached db connection info
    const config_client = require('../config/config.js');
    const sqs_client = require('../api/clients/sqs_client.js');
    logger.debug('Polling sqs for new messages');

    // needed further down in the promise chain
    let sqs_url;

    return config_client.getDefaultAws()
        .then(response => {
            sqs_client.init(response.aws);
            return config_client.query({
                name: 'DEFAULT',
                type: 'QUEUE'
            });
        })
        .then(queue => {
            sqs_url = queue.url;
            return sqs_client.getMessage(sqs_url);
        })
        .then(messages => {
            if (messages) {
                logger.debug(`found ${messages.length} SQS messages`);
                parseMessages(messages, sqs_url);
            } else {
                throw 'Found 0 SQS messages';
            }
        })
        .catch(err => {
            logger.debug(err);
        });
};

function kick_it() {
    repeat(poll)
        .every(21, 's')
        .start.in(Math.floor(Math.random() * 10) + 1, 'sec');
}

module.exports = kick_it();
