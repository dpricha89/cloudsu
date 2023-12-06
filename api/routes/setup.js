/*jshint esversion: 6 */
'use strict';

const _ = require('underscore');
const logger = require('../../utls/logger.js');
const crypto_client = require('../../utls/crypto_client.js');
const token = require('../../utls/token.js');
const err_handler = require('../../utls/error_handler.js');
const secure = require('../../config/secure_config.js');
const fs = require('fs');
const path = require('path');
const stacks_client = require('../clients/stacks_client.js');
const iam_client = require('../clients/iam_client.js');
const sqs_client = require('../clients/sqs_client.js');
let db;

const SETUP_TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../../templates/SETUP/setup.json'), 'utf8');
const DEFAULT_FILE = fs.readFileSync(path.resolve(__dirname, '../../config/defaults.json'), 'utf8');


function finishConfig(params) {
    return stacks_client.stack(params.stack_name)
        .then(response => {
            //get admin account
            const cloudsuAdmin = _.find(response.StackResources, function(x) {
                return x.LogicalResourceId === 'cloudsuAdmin';
            });
            //get servers account
            const cloudsuRO = _.find(response.StackResources, function(x) {
                return x.LogicalResourceId === 'cloudsuRO';
            });

            const cloudsuSqs = _.find(response.StackResources, function(x) {
                return x.ResourceType === 'AWS::SQS::Queue';
            });

            const cloudsuSns = _.find(response.StackResources, function(x) {
                return x.ResourceType === 'AWS::SNS::Topic';
            });


            return iam_client.createKey(cloudsuAdmin.PhysicalResourceId)
                .then(account => {
                    let db_key = account.AccessKey;
                    db_key.region = params.aws.region;
                    db_key = _.omit(db_key, 'CreateDate');
                    return secure.save('db', db_key);
                })
                .then(() => {
                    logger.info('Created access key for config DB');
                    return iam_client.createKey(cloudsuRO.PhysicalResourceId);
                })
                .then(account => {
                    let db_key = account.AccessKey;
                    db_key.region = params.aws.region;
                    db_key = _.omit(db_key, 'CreateDate');
                    return secure.save('db_client', db_key);
                })
                .then(() => {
                    logger.info('Created RO key for server DB');
                    return sqs_client.getQueueArn(cloudsuSqs.PhysicalResourceId);
                })
                .then(queue_arn => {
                    return db.insert({
                        type: 'QUEUE',
                        name: 'DEFAULT',
                        queue: cloudsuSqs.LogicalResourceId,
                        arn: queue_arn,
                        url: cloudsuSqs.PhysicalResourceId
                    });
                })
                .then(() => {
                    logger.info('Saving SNS and SQS info to DEFAULT AWS account in DB');
                    return db.insert({
                        type: 'TOPIC',
                        name: 'DEFAULT',
                        arn: cloudsuSns.PhysicalResourceId
                    });
                });
        });
}


class Setup {

    constructor() {}

    run(req, res) {

        let params = req.body;
        params.stack_name = 'cloudsu';
        params.table_name = 'cloudsu_config';
        const initial_data = JSON.parse(DEFAULT_FILE);

        const aws_account = {
            region: params.aws.region,
            accessKeyId: params.aws.key,
            secretAccessKey: params.aws.secret
        };

        // set creds for each aws service
        const sqs_cred = _.clone(aws_account);
        const iam_cred = _.clone(aws_account);
        const stacks_cred = _.clone(aws_account);
        const dynasty_cred = _.clone(aws_account);

        // encrypt aws secret
        let aws_cred = _.clone(params.aws);
        aws_cred.secret = crypto_client.encrypt_string(aws_cred.secret);

        // encrypt chef key
        let chef_account = _.clone(params.cms);
        chef_account.key = crypto_client.encrypt_string(chef_account.key);

        // encrypt user password
        let user = params.user;
        user.aws_account = params.aws.name;
        user.aws_region = params.aws.region;
        user.hash = crypto_client.encrypt(user.password);
        user.token = token.sign(user.name);
        user.admin = true;
        user.invincible = true;
        user = _.omit(user, ['password', 'confirm']);

        // setup dynasty library
        const dynasty = require('dynasty')(dynasty_cred);

        //init stackclient with create
        stacks_client.init(stacks_cred);
        iam_client.init(iam_cred);
        sqs_client.init(sqs_cred);

        return stacks_client.createSetupStack(params.stack_name, SETUP_TEMPLATE)
            .then(() => {
                res.status(200).json('Started creation of stack');
                logger.info(`Created stack ${params.stack_name}`);
                return stacks_client.waitForStack(params.stack_name, 15, 50);
            })
            .then(() => {
                db = dynasty.table(params.table_name);
                return db.insert(initial_data);
            })
            .then(() => {
                logger.info('Added initial data to DB');
                return db.insert(aws_cred);
            })
            .then(() => {
                logger.info('Encrypted and added AWS account to DB');
                return db.insert(user);
            })
            .then(() => {
                logger.info('Hashed and salted admin user password');
                logger.info('Added admin user to DB');
                return db.insert(chef_account);
            })
            .then(() => {
                logger.info('Added chef account to DB');
                return finishConfig(params);
            })
            .catch(err => {
                logger.error(err);
                res.status(500).json(err_handler(err));
            });

    }


}


module.exports = new Setup();
