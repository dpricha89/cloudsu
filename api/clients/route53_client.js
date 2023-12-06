/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');


class Route53Client {
    constructor() {}

    init(account) {
        this.route53_client = Promise.promisifyAll(new AWS.Route53(account));
    }
}

module.exports = new Route53Client();
