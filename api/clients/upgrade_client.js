/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');

const chef_client = require('./chef_client.js');
const stacks_client = require('./stacks_client.js');
const template_client = require('./template_client.js');
const autoscale_client = require('./autoscale_client.js');
const elb_client = require('./elb_client.js');
const logger = require('../../utls/logger.js');

const utls = require('../../utls/utilities.js');

class UpgradeClient {
    constructor() {}

    init(params) {

        chef_client.init(params.cms);
        stacks_client.init(params.aws_account);
        autoscale_client.init(params.aws_account);
        elb_client.init(params.aws_account);

    }

    full(params) {
        //determine upgrade type
        return this.getBuildSize(params)
            .then(build_size => {
                if (build_size === 'HA') {
                    logger.info('HA upgrade initiated');
                    return this.advancedUpgrade(params);
                } else if (build_size === 'Single') {
                    logger.info('Simple upgrade initiated');
                    return this.simpleUpgrade(params);
                }
                throw new Error('Cannot retrieve build size for environment');
            });

    }

    stage1(params) {

        //params = {
        //    "stack_name": "Testing",
        //    "min_size": 1,
        //    "desired_size": 1,
        //    "max_size": 3,
        //    "ami": "ami-c229c0a2",
        //    "instance_size": "t2.nano",
        //    "app_version": "prod13"
        //}

        const self = this;
        let env;

        return this.getBuildSize(params)
            .then(build_size => {
                if (build_size === 'HA') {
                    logger.info('Upgrade stage 1 started');
                    return this.checkEnv(params)
                        .then(environment => {
                            env = environment;
                            return self.upgradeStartSetup(env, params);
                        })
                        .then(() => {
                            return self.lockNodes(env, params);
                        })
                        .then(() => {
                            return self.updateEnvVersion(env, params);
                        })
                        .then(() => {
                            //extend chef env options to params
                            params = _.extend(_.clone(env.default_attributes.cloudsu_params), params);
                            return self.launchServers(env, params);
                        })
                        .then(() => {
                            return self.updateEnvStatus('UPGRADING_STAGE_1', params);
                        });

                } else if (build_size === 'Single') {
                    throw new Error('Stage upgrade is only available for HA environments');
                }
                throw new Error('Cannot retrieve build size for environment');
            });
    }

    stage2(params) {

        //params = {
        //   stack_name: testing
        //}

        const self = this;
        let env;

        return chef_client.getEnvironment(params.stack_name)
            .then(environment => {
                env = environment;

                //attach params from environment needed
                params.app_name = env.default_attributes.cloudsu_params.app_name;
                params.app_version = env.default_attributes.cloudsu_params.app_version;
                return elb_client.connectElbs(params);
            })
            .then(() => {
                return self.updateEnvStatus('UPGRADING_STAGE_2', params);
            });
    }

    stage3(params) {

        //params = {
        //    stack_name: testing
        //}

        const self = this;
        let env;

        return chef_client.getEnvironment(params.stack_name)
            .then(environment => {
                env = environment;

                //attach params from environment needed
                params.app_name = env.default_attributes.cloudsu_params.app_name;
                params.last_version = env.default_attributes.cloudsu_params.last_version;
                return elb_client.disconnectElbs(params);
            })
            .then(() => {
                return self.updateEnvStatus('UPGRADING_STAGE_3', params);
            });
    }

    stage4(params) {

        //params = {
        //    stack_name: testing,    
        //    cleanup_type: tag | delete,
        //}

        const self = this;
        let env;

        return chef_client.getEnvironment(params.stack_name)
            .then(environment => {
                env = environment;

                //attach params from environment needed
                params.app_name = env.default_attributes.cloudsu_params.app_name;
                params.last_version = env.default_attributes.cloudsu_params.last_version;

                //remove non-alphas from app_name and version
                params = utls.remove_non_alpha(params);

                return self.cleanup(params);
            })
            .then(() => {
                return self.upgradeFinished(env, params);
            });
    }

    rollback(params) {

        let env;
        const self = this;

        return chef_client.getEnvironment(params.stack_name)
            .then(environment => {
                env = environment;
                params.app_name = env.default_attributes._params.app_name;
                params.app_version = env.default_attributes.cloudsu_params.last_version;
                params.last_version = env.default_attributes.cloudsu_params.app_version;

                env.default_attributes[params.app_name].version = params.app_version;
                env.default_attributes.cloudsu_params.app_version = params.app_version;
                env.default_attributes.rollback_available = false;
                return self.connectELB(params);
            })
            .then(() => {
                return chef_client.updateEnvironment(env);
            });
    }

    simpleUpgrade(params) {

        const self = this;
        let env;

        return this.checkEnv(params)
            .then(environment => {
                env = environment;
                return self.updateEnvVersion(env, params);
            })
            .then(() => {
                return self.upgradeFinished(env, params);
            });

    }

    advancedUpgrade(params) {

        const self = this;
        params.chef_status = 'UPGRADING';
        var env;

        function verifyStack() {
            return stacks_client.waitForStack(params.stack_name, 20, 500)
                .then(() => {
                    if (params.create_elb) {
                        return self.connectELB(params);
                    }
                })
                .then(() => {
                    return self.cleanup(params);
                })
                .then(() => {
                    return self.upgradeFinished(env, params);
                });
        }

        return this.checkEnv(params)
            .then(environment => {
                env = environment;
                return self.upgradeStartSetup(env, params);
            })
            .then(() => {
                return self.lockNodes(env, params);
            })
            .then(() => {
                return self.updateEnvVersion(env, params);
            })
            .then(() => {
                //extend chef env options to params
                params = _.extend(_.clone(env.default_attributes.cloudsu_params), params);
                return self.launchServers(env, params);
            })
            .then(() => {
                verifyStack();
                return 'Sucessfully started upgrade';
            });

    }

    getBuildSize(params) {
        return chef_client.getEnvironment(params.stack_name)
            .then(response => {
                return response.default_attributes.cloudsu_params.build_size;
            });
    }

    checkEnv(params) {

        let environment;

        return chef_client.getEnvironment(params.stack_name)
            .then(response => {
                environment = response;
                if (response.default_attributes.status !== 'READY' && !params.force_upgrade) {
                    throw new Error('Chef environment is not in READY state');
                }
                return stacks_client.stackStatus(params.stack_name);
            })
            .then(status => {
                //return if stack is already in a progress state
                if (status.includes('PROGRESS')) {
                    throw new Error(`Stack in a PROGRESS state: ${status}`);
                }
                return;
            })
            .then(() => {

                params.last_version = _.clone(environment.default_attributes.cloudsu_params.app_version);

                if (params.last_version === params.app_version) {
                    throw new Error(`Upgrade version is already live: ${params.app_version}`);
                }

                return environment;
            });

    }

    upgradeStartSetup(environment, params) {

        const cloudsu_params = environment.default_attributes.cloudsu_params;

        const options = _.extend(cloudsu_params, _.omit(_.clone(params), ['aws',
            'cms',
            'aws_account',
            'upgrade_type',
            'cleanup_type',
            'force_upgrade'
        ]));

        params.app_name = cloudsu_params.app_name;
        params.last_environment = _.clone(environment);
        environment.default_attributes.cloudsu_params = options;
        environment.default_attributes.status = params.chef_status;

        return chef_client.updateEnvironment(environment);
    }

    lockNodes(environment, params) {
        let default_attributes = environment.default_attributes;

        return chef_client.getEnvironmentNodes(params.stack_name)
            .then(nodes => {
                //loop over each node in environment
                return Promise.map(nodes, node => {
                    //get and update node
                    return chef_client.getNode(node)
                        .then(node_body => {
                            node_body.normal = default_attributes;
                            return chef_client.updateNode(node_body);
                        });

                });

            });
    }

    launchServers(environment, params) {

        logger.info(`Launching servers for stack: ${params.stack_name}`);

        const cloudsu_params = environment.default_attributes.cloudsu_params;
        const launch_params = _.extend(_.clone(params), cloudsu_params);

        return stacks_client.getTemplate(params.stack_name)
            .then(template => {
                return template_client.get(template, launch_params);
            })
            .then(template => {
                return stacks_client.updateStack(params.stack_name, template);
            });

    }

    cleanup(params) {

        logger.info(`Running cleanup job: ${params.stack_name}`);

        if (params.cleanup_type === 'delete') {
            return this.removeOldServers(params);
        }
        return this.tagOldServers(params);
    }

    removeOldServers(params) {

        logger.info(`Removing old servers: ${params.stack_name} version: ${params.last_version}`);
        let template;

        return stacks_client.getTemplate(params.stack_name)
            .then(template_body => {
                template = JSON.parse(template_body);
                const service = utls.remove_non_alpha(_.clone({
                    app_name: params.app_name,
                    version: params.last_version
                }));
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
                return;

            })
            .then(() => {
                return stacks_client.updateStack(params.stack_name, JSON.stringify(template));
            });
    }

    tagOldServers(params) {

        const terminate_date = params.tag_date || moment().add(24, 'hours').format('YYYYMMDDHHmm');

        logger.info(`Tagging old servers with date: ${terminate_date}`);

        return stacks_client.stack(params.stack_name)
            .then(stack => {
                const service = utls.remove_non_alpha(_.clone({
                    app_name: params.app_name,
                    version: params.last_version
                }));
                const as_name = `ASG${service.app_name}${service.version}`;
                const as_group = _.find(stack.StackResources, x => {
                    return x.LogicalResourceId === as_name;
                });
                if (as_name && as_group) {
                    return autoscale_client.addTags(as_group, 'terminate_date', terminate_date);
                }
                logger.error('Missing data to tag servers with termination date');
            });
    }

    connectELB(params) {

        logger.info(`Connecting ELB's for stack: ${params.stack_name}`);

        //connect elb and wait 15 sec to disconnect old stack_name
        //this delay give the elb time to put those new servers inService
        return elb_client.connectElbs(params)
            .delay(15000)
            .then(() => {
                return elb_client.disconnectElbs(params);
            });

    }

    upgradeFinished(environment, params) {

        logger.info(`Finished upgrade for stack: ${params.stack_name}`);

        if (params.cleanup_type === 'tag') {
            environment.default_attributes.rollback_available = true;
        }

        environment.default_attributes.cloudsu_params.upgrade_time = Math.round(+new Date() / 1000);
        environment.default_attributes.status = 'READY';

        return chef_client.updateEnvironment(environment);
    }

    updateEnvStatus(status, params) {
        //update chef environment status
        logger.info(`Updating environment: ${params.stack_name} with status: ${status}`);
        return chef_client.getEnvironment(params.stack_name)
            .then(environment => {
                environment.default_attributes.status = status;
                return chef_client.updateEnvironment(environment);
            });
    }

    updateEnvVersion(environment, params) {

        logger.info(`Updating environment version: ${params.app_version} stack: ${params.stack_name}`);

        environment.default_attributes[params.app_name].version = params.app_version;
        environment.default_attributes.cloudsu_params.last_version = params.last_version;
        environment.default_attributes.cloudsu_params.app_version = params.app_version;

        return chef_client.updateEnvironment(environment);

    }

}

module.exports = new UpgradeClient();
