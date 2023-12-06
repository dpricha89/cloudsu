/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const _ = require('underscore');
const retry = require('bluebird-retry');

const utls = require('../../utls/utilities.js');
const logger = require('../../utls/logger.js');

//clients
const template_client = require('./template_client.js');
const elb_client = require('./elb_client.js');

//verify client
const verify = require('../../utls/verify.js');


class StacksClient {

    constructor() {}

    init(account) {
        this.cloudformation = Promise.promisifyAll(new AWS.CloudFormation(account));
        elb_client.init(account);
    }

    listStacks() {
        logger.info('Getting list of stacks');
        return this.cloudformation.listStacksAsync({
                StackStatusFilter: [
                    'CREATE_IN_PROGRESS',
                    'CREATE_FAILED',
                    'CREATE_COMPLETE',
                    'ROLLBACK_IN_PROGRESS',
                    'ROLLBACK_FAILED',
                    'ROLLBACK_COMPLETE',
                    'DELETE_IN_PROGRESS',
                    'DELETE_FAILED',
                    'UPDATE_IN_PROGRESS',
                    'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
                    'UPDATE_COMPLETE',
                    'UPDATE_ROLLBACK_IN_PROGRESS',
                    'UPDATE_ROLLBACK_FAILED',
                    'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
                    'UPDATE_ROLLBACK_COMPLETE'
                ]
            })
            .then(response => {
                return _.filter(response.StackSummaries, x => {
                    return x.TemplateDescription === 'Template managed by cloudsu';
                });
            });

    }

    stack(stack_name) {
        return this.cloudformation.describeStackResourcesAsync({
            StackName: stack_name
        });
    }

    stackStatus(stack_name) {
        logger.info(`Getting stack status: ${stack_name}`);
        return this.cloudformation.describeStacksAsync({
                StackName: stack_name
            })
            .then(response => {
                const status = _.first(response.Stacks)
                    .StackStatus;
                return status;
            });
    }

    createStack(params) {

        const self = this;
        logger.info(`Creating stack: ${params.stack_name}`);

        //allows api to return while backend verifies
        function verifyStack(params) {
            return self.waitForStack(params.stack_name, 15, 50)
                .then(result => {
                    if (params.build_size === 'HA') {
                        return elb_client.connectElbs(params);
                    }
                });
        }

        //init chef client
        const chef_client = require('./chef_client.js');
        chef_client.init(params.cms);

        //make sure template is created correctly
        params.type = 'create';

        //verify parameters to ensure they are valid
        return verify.verify_create_stack(params)
            .then(() => {
                //create template with posted params
                return template_client.get(null, params)
                    .then(template => {
                        //send template to aws
                        return self.cloudformation.createStackAsync({
                            StackName: params.stack_name,
                            TemplateBody: template,
                            Tags: [{
                                Key: 'stack_type',
                                Value: 'cloudsu'
                            }]
                        });
                    });
            })
            .then(() => {
                //create chef environment with params
                return chef_client.createEnvironment(params);
            })
            .then(() => {
                //verify stack
                verifyStack(params);

                //return success message
                return 'success';
            });
    }

    createSetupStack(stack_name, template) {
        return this.cloudformation.createStackAsync({
            StackName: stack_name,
            TemplateBody: template,
            Capabilities: [
                'CAPABILITY_IAM'
            ]
        });
    }

    deleteAsg(params) {

        const self = this;

        return this.getTemplate(params.stack_name)
            .then(template_body => {
                const template = JSON.parse(template_body);
                const service = utls.remove_non_alpha(_.clone(params));
                const cf_name = service.app_name + service.version;
                const omit_list = [`ASG${cf_name}`,
                    `LC${cf_name}`,
                    `CPUH${cf_name}`,
                    `CPUL${cf_name}`,
                    `SPD${cf_name}`,
                    `SPU${cf_name}`,
                    `WC${cf_name}`
                ];
                template.Resources = _.omit(template.Resources, omit_list);
                return self.updateStack(params.stack_name, JSON.stringify(template));
            });

    }

    adjustSize(params) {

        const self = this;

        return this.getTemplate(params.stack_name)
            .then(template_body => {
                const template = JSON.parse(template_body);
                const service = utls.remove_non_alpha(_.clone(params));
                const cf_name = service.app_name + service.version;
                template.Resources[`ASG${cf_name}`].Properties.MinSize = params.min_size;
                template.Resources[`ASG${cf_name}`].Properties.DesiredCapacity = params.desired;
                template.Resources[`ASG${cf_name}`].Properties.MaxSize = params.max_size;
                console.log(params.stack_name);
                return self.updateStack(params.stack_name, JSON.stringify(template));
            });
    }

    deleteStack(params) {

        const chef_client = require('./chef_client.js');
        chef_client.init(params.cms);

        logger.info(`Deleting stack: ${params.stack_name}`);

        return this.cloudformation.deleteStackAsync({
                StackName: params.stack_name
            })
            .then(() => {
                return chef_client.deleteEnvironmentNodes(params.stack_name);
            })
            .then(response => {
                return chef_client.deleteEnvironment(params.stack_name);
            })
            .then(() => {
                return `successfully deleted stack: ${params.stack_name}`;
            });
    }

    waitForStack(stack_name, timeout, max_attempts) {
        //wait for stack success message
        const self = this;
        let count = 0;

        timeout = timeout || 20;
        max_attempts = max_attempts || 500;

        const check_status = function () {
            count++;
            return self.cloudformation.describeStacksAsync({
                    StackName: stack_name
                })
                .then(response => {
                    const stack = _.find(response.Stacks, x => {
                        return x.StackName === stack_name;
                    });
                    logger.info(`Polling for stack success: ${stack_name} status: ${stack.StackStatus}`);
                    if (!stack) {
                        throw new retry.StopError('Stack not found');
                    } else if (count > max_attempts) {
                        logger.info('Exited early before success status');
                        return;
                    } else if (stack.StackStatus === 'UPDATE_COMPLETE' || stack.StackStatus === 'CREATE_COMPLETE') {
                        // Success!
                        const successMsg = 'stack is ready';
                        logger.info(successMsg, stack_name);
                        return successMsg;
                    } else if (stack.StackStatus === 'UPDATE_IN_PROGRESS' || stack.StackStatus === 'CREATE_IN_PROGRESS') {
                        throw new Error(`Stack is not ready: ${stack.StackStatus}`);
                    } else if (stack.StackStatus.includes('ROLLBACK')) {
                        throw new retry.StopError(`Stack in unexexpected state: ${stack.StackStatus}`);
                    }
                });
        };

        return retry(check_status, {
            interval: 10 * 1000,
            timeout: timeout * 60 * 1000
        });
    }

    describe(stack_name) {
        return this.cloudformation.describeStacksAsync({
                StackName: stack_name
            })
            .then(response => {
                return _.first(response.Stacks);
            });
    }

    getTemplate(stack_name) {

        logger.info(`Getting stack template: ${stack_name}`);

        return this.cloudformation.getTemplateAsync({
                StackName: stack_name
            })
            .then(response => {
                return response.TemplateBody;
            });
    }

    updateStack(stack_name, template) {

        logger.info(`Updating stack: ${stack_name}`);

        return this.cloudformation.updateStackAsync({
            StackName: stack_name,
            TemplateBody: template
        });
    }

    describeEvents(stack_name) {
        return this.cloudformation.describeStackEventsAsync({
                StackName: stack_name
            })
            .then(response => {
                return response.StackEvents;
            });
    }
}

module.exports = new StacksClient();
