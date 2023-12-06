/*jshint esversion: 6 */
'use strict';

const _ = require('underscore');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const cache = require('../../utls/cache.js');
const logger = require('../../utls/logger.js');


class Ec2Client {
    constructor() {}

    init(account) {
        this.ec2 = Promise.promisifyAll(new AWS.EC2(account));
    }

    instances(instance_array) {
        return this.ec2.describeInstancesAsync({
                InstanceIds: instance_array
            })
            .then(result => {
                return _.chain(result.Reservations)
                    .pluck('Instances')
                    .flatten();
            });
    }

    instancesByStack(stack_name) {
        return this.ec2.describeInstancesAsync({
            Filters: [{
                Name: 'tag:aws:cloudformation:stack-name',
                Values: [stack_name]
            }]
        });
    }

    describeKeyPairs() {
        return this.ec2.describeKeyPairsAsync()
            .then(keys => {
                return keys.KeyPairs;
            });
    }

    sampleImages(region) {

        const self = this;

        return cache.get(`images_${region}`)
            .then(images => {

                if (images) {
                    logger.debug(`Using cache for ec2 images: images_${region}`);
                    return images;
                }

                return self.ec2.describeImagesAsync({
                        Filters: [{
                            Name: 'name',
                            Values: [
                                'amzn-ami-hvm-2016.03.0.x86_64-gp2',
                                'ubuntu/images/hvm-ssd/ubuntu-trusty-14.04-amd64-server-20160114.5'
                            ]
                        }]
                    })
                    .then(response => {
                        cache.set(`images_${region}`, response.Images);
                        return response.Images;
                    });

            });
    }

    instanceStoreMap() {

        const config = require('../../config/config.js');

        return config.get('aws_instancestore_map')
            .then(stores => {
                return stores;
            });
    }

    describeSecurityGroups() {
        return this.ec2.describeSecurityGroupsAsync()
            .then(response => {
                return response.SecurityGroups;
            });
    }

}

module.exports = new Ec2Client();
