/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');


class AutoscaleClient {
    constructor() {}

    init(account) {
        this.autoscaling = Promise.promisifyAll(new AWS.AutoScaling(
            account
        ));
    }

    describeAutoScalingGroups(groups) {
        return this.autoscaling.describeAutoScalingGroupsAsync({
            AutoScalingGroupNames: groups
        });
    }

    addTags(as_group, key, value) {
        // addTags(autoscale group name, key, value)
        return this.autoscaling.createOrUpdateTagsAsync({
            Tags: [{
                ResourceId: as_group.PhysicalResourceId,
                Key: key,
                Value: value,
                PropagateAtLaunch: true,
                ResourceType: 'auto-scaling-group'
            }]
        });
    }
}

module.exports = new AutoscaleClient();
