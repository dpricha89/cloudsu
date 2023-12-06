/*jshint esversion: 6 */
'use strict';

const _ = require('underscore');
const logger = require('./logger.js');
const Promise = require('bluebird');

function cache() {}

if (process.env.REDIS_HOST) {
    const options = _.extend({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }, {
        password: process.env.REDIS_PASSWORD
    });
    const redis = require('redis-node');
    var client = redis.createClient(options);

    //event listeners
    client.on('connect', function() {
        logger.debug(`Successful connection to redis: ${options.host} port: ${options.port}`);
    });
    client.on('error', function(err) {
        logger.error(err);
    });

    cache.prototype.get = function(key) {
        return new Promise(function(resolve, reject) {
            client.get(key, function(err, value) {
                if (err) {
                    return reject(err);
                }

                return resolve(JSON.parse(value));
            });
        });
    };

    cache.prototype.set = function(key, obj) {
        return client.set(key, JSON.stringify(obj));
    };

    cache.prototype.flush = function() {
        return client.flushall();
    };


} else {
    const NodeCache = require('node-cache');
    var client = new NodeCache({
        stdTTL: 3000,
        checkperiod: 150
    });


    cache.prototype.get = function(key) {
        return new Promise(function(resolve, reject) {
            return resolve(client.get(key));
        });
    };

    cache.prototype.set = function(key, obj) {
        return client.set(key, obj);
    };

    cache.prototype.flush = function() {
        return client.flushAll();
    };
}


module.exports = new cache();
