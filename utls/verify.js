/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const _ = require('underscore');

const create_stack_keys = [
    'ami',
    'app_name',
    'app_version',
    'build_size',
    'domain',
    'instance_size',
    'key',
    'regions',
    'security_groups',
    'stack_name'
];
const elb_verify_keys = [
    'ping_port',
    'ping_protocol'
];

/*
This class is used to verify parameters sent from api

This should return a verbose error to help users diagnose
*/


class Verify {

    constructor() {}

    verify_create_stack(params) {

        return Promise.map(create_stack_keys, key => {
                if (!_.has(params, key)) {
                    throw new Error(`Missing parameter: ${key}`);
                }
            })
            .then(() => {
                if (params.elb) {
                    return Promise.map(elb_verify_keys, key => {
                        if (!_.has(params.elb, key)) {
                            throw new Error(`Missing parameter: ${key}`);
                        }
                    });
                }
                return;
            });

    }

}

module.exports = new Verify();
