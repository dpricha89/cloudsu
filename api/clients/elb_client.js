/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const _ = require('underscore');

const utls = require('../../utls/utilities.js');
const logger = require('../../utls/logger.js');

class ElbClient {
    constructor() {}

    init(account) {

        this.elb = Promise.promisifyAll(new AWS.ELB(account));
        this.autoscaling = Promise.promisifyAll(new AWS.AutoScaling(account));
        this.cloudformation = Promise.promisifyAll(new AWS.CloudFormation(account));

    }

    connectElbs(params) {

        const self = this;

        return this.cloudformation.describeStackResourcesAsync({
            StackName: params.stack_name
        }).then(stack => {
            const service = utls.remove_non_alpha(_.clone({
                app_name: params.app_name,
                version: params.app_version
            }));
            const as_name = ['ASG', service.app_name, service.version].join('');
            const elb_name = ['ELB', service.app_name].join('');
            const as_group = _.find(stack.StackResources, x => {
                return x.LogicalResourceId === as_name;
            });
            const elb = _.find(stack.StackResources, x => {
                return x.LogicalResourceId === elb_name;
            });
            logger.info(`Connecting ASG: ${as_name} to ELB: ${elb_name}`);
            if (elb && as_group) {
                return self.autoscaling.attachLoadBalancersAsync({
                    AutoScalingGroupName: as_group.PhysicalResourceId,
                    LoadBalancerNames: [elb.PhysicalResourceId]
                });
            }
            logger.error('Not able to find appropriate data to connect elb');
        });
    }

    disconnectElbs(params) {

        const self = this;

        return this.cloudformation.describeStackResourcesAsync({
            StackName: params.stack_name
        }).then(stack => {
            const service = utls.remove_non_alpha(_.clone({
                app_name: params.app_name,
                version: params.last_version
            }));
            const as_name = ['ASG', service.app_name, service.version].join('');
            const elb_name = ['ELB', service.app_name].join('');

            const as_group = _.find(stack.StackResources, x => {
                return x.LogicalResourceId === as_name;
            });
            const elb = _.find(stack.StackResources, x => {
                return x.LogicalResourceId === elb_name;
            });

            logger.info(`Disconnecting ASG: ${as_name} from ELB: ${elb_name}`);
            if (elb && as_group) {
                return self.autoscaling.detachLoadBalancersAsync({
                    AutoScalingGroupName: as_group.PhysicalResourceId,
                    LoadBalancerNames: [elb.PhysicalResourceId]
                });
            }
            logger.error('Not able to find appropriate data to disconnect elb');
        });
    }

    connectElb(params) {
        logger.info(`Connecting ASG: ${params.scale_group} from ELB: ${params.elb}`);
        return this.autoscaling.attachLoadBalancersAsync({
            AutoScalingGroupName: params.scale_group,
            LoadBalancerNames: [params.elb]
        });
    }

    disconnectElb(params) {
        logger.info(`Connecting ASG: ${params.scale_group} from ELB: ${params.elb}`);
        return this.autoscaling.detachLoadBalancersAsync({
            AutoScalingGroupName: params.scale_group,
            LoadBalancerNames: [params.elb]
        });
    }

    getAvailableElbs(stack_name) {
        return this.cloudformation.describeStackResourcesAsync({
                StackName: stack_name
            })
            .then(stack => {
                const elbs = _.filter(stack.StackResources, x => {
                    return x.ResourceType === 'AWS::ElasticLoadBalancing::LoadBalancer';
                });
                return elbs;
            });
    }

    getElbs(elbs) {
        return this.elb.describeLoadBalancersAsync({
            LoadBalancerNames: elbs
        });
    }
}

module.exports = new ElbClient();
