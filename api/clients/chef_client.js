/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const chef = require('chef');
const logger = require('../../utls/logger.js');


class ChefClient {
    constructor() {}

    init(account) {
        const _client = chef.createClient(account.username, account.key, account.url);
        this.client = Promise.promisifyAll(_client);
    }

    createEnvironment(params) {

        logger.info(`Creating chef environment: ${params.stack_name}`);
        let cloudsu_params = _.clone(params);

        cloudsu_params = _.omit(cloudsu_params, [
            'elb_groups_string',
            'instance_groups_string',
            'cms_validator',
            'recipes_string',
            'cms_validator',
            'cms_url',
            'cms_key',
            'cms',
            'aws'
        ]);

        const default_attributes = {};
        default_attributes.status = 'READY';
        default_attributes[params.app_name] = {};
        default_attributes[params.app_name].version = params.app_version;
        default_attributes.rollback_available = false;
        default_attributes.cloudsu_params = cloudsu_params;

        const environment = {
            name: params.stack_name,
            description: 'Managed by cloudsu',
            json_class: 'Chef::Environment',
            chef_type: 'environment',
            cookbook_versions: {},
            default_attributes: default_attributes,
            override_attributes: {}
        };

        return this.client.postAsync('/environments', environment)
            .then(result => {
                return result.body;
            });

    }

    getEnvironment(environment) {
        return this.client.getAsync(`/environments/${environment}`)
            .then(result => {
                return result.body;
            });
    }

    getEnvironments() {
        return this.client.getAsync('/environments')
            .then(result => {
                return result.body;
            });
    }

    getEnvironmentNodes(environment) {
        return this.client.getAsync(`/environments/${environment}/nodes`)
            .then(result => {
                return _.keys(result.body);
            });
    }

    updateEnvironment(params) {
        return this.client.putAsync(`/environments/${params.name}`, params)
            .then(result => {
                return result.body;
            });
    }

    deleteEnvironment(environment) {
        logger.info(`Deleting chef environment: ${environment}`);
        return this.client.deleteAsync(`/environments/${environment}`)
            .then(result => {
                return result.body;
            });
    }

    deleteEnvironmentNodes(environment) {

        logger.info(`Removing all chef nodes in environment: ${environment}`);
        const self = this;

        return this.getEnvironmentNodes(environment)
            .then(nodes => {
                // catch empty response
                if (!nodes) {
                    return;
                }
                // remove node and client from chef
                return Promise.map(nodes, node => {
                    return self.deleteNode(node);
                });
            });
    }

    rollbackCheck(environment) {
        return this.getEnvironment(environment)
            .then(response => {
                return response.default_attributes.rollback_available;
            });
    }

    createNode(params) {
        logger.info(`Creating chef node: ${params.name}`);
        return this.client.postAsync(`/nodes/${params.name}`, params)
            .then(result => {
                return result.body;
            });
    }

    getNode(node) {
        return this.client.getAsync(`/nodes/${node}`)
            .then(result => {
                return result.body;
            });
    }

    updateNode(node) {
        return this.client.putAsync(`/nodes/${node.name}`, node)
            .then(result => {
                return result.body;
            });
    }

    deleteNode(node) {

        logger.info(`Deleting chef node: ${node}`);
        const self = this;

        return this.client.deleteAsync(`/nodes/${node}`)
            .then(result => {
                return self.deleteClient(node);
            })
            .catch(function(err) {
                logger.error(err);
            });
    }

    createClient(params) {
        logger.info(`Creating chef client: ${params.name}`);
        return this.client.postAsync('/clients', params)
            .then(result => {
                return result.body;
            });
    }

    getClient(client) {
        return this.client.getAsync(`/clients/${client}`)
            .then(result => {
                return result.body;
            });
    }

    deleteClient(client) {
        logger.debug(`Deleting chef client: ${client}`);
        return this.client.deleteAsync(`/clients/${client}`)
            .then(result => {
                return result.body;
            })
            .catch(err => {
                logger.info('Client does not exist');
            });
    }

    createDataBag(params) {
        return this.client.postAsync('/data/', params)
            .then(result => {
                return result.body;
            });
    }

    getDataBag(data_bag) {
        return this.client.getAsync(`/data/${data_bag}`)
            .then(result => {
                return _.keys(result.body);
            });
    }

    getDataBagItem(data_bag, item) {
        return this.client.getAsync(`/data/${data_bag}/${item}`)
            .then(result => {
                return result.body;
            });
    }

    saveDataBagItem(data_bag, item) {
        return this.client.putAsync(`/data/${data_bag}/${item}`)
            .then(result => {
                return result.body;
            });
    }

    recipes() {
        return this.client.getAsync('/cookbooks/_recipes')
            .then(result => {
                return result.body;
            });
    }
}

module.exports = new ChefClient();
