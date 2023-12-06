/*jshint esversion: 6 */
'use strict';

const _ = require('underscore');
const logger = require('../utls/logger.js');
const cache = require('../utls/cache.js');
const Promise = require('bluebird');
const crypto_client = require('../utls/crypto_client.js');

function decrypt(account) {

    var key;

    if (account.type === 'CMS') {
        key = account.key;
    } else if (account.type === 'AWS') {
        key = account.secret;
    }

    return crypto_client.decrypt_string(key)
        .then(x => {
            if (account.type === 'AWS') {
                account.aws = {};
                account.aws.region = account.region;
                account.aws.accessKeyId = account.key;
                account.aws.secretAccessKey = x;
            } else {
                account.key = x;
            }
            return (account);
        });
}




class Config {
    constructor() {}

    save(key, value) {

        //added inside function to call after Setup
        const db = require('../utls/db.js');

        //flush cache on updates
        cache.flush();

        // save settings to global
        const obj = {};
        obj[key] = value;
        logger.debug(`Saving key to database: ${key}`);

        return db.update({
            hash: 'SETTINGS',
            range: 'GLOBAL'
        }, obj);


    }

    get(key) {

        const db = require('../utls/db.js');

        logger.debug(`Getting data from db for key: ${key}`);
        return cache.get('GLOBAL')
            .then(global_config => {

                if (global_config) {
                    const val = global_config[key];
                    if (val) {
                        return val;
                    }
                }
                // get settings from globals
                return db.find({
                        hash: 'SETTINGS',
                        range: 'GLOBAL'
                    })
                    .then(settings => {
                        cache.set('GLOBAL', settings);
                        return settings[key];
                    });
            });
    }

    getAll() {

        return new Promise(function (resolve, reject) {

            logger.debug('Getting all global settings');

            const db = require('../utls/db.js');
            return cache.get('GLOBAL')
                .then(val => {

                    //return value if not undef
                    if (val) {
                        return resolve(val);
                    }

                    return db.find({
                            hash: 'SETTINGS',
                            range: 'GLOBAL'
                        })
                        .then(response => {
                            cache.set('GLOBAL', response);
                            return resolve(response);
                        });
                });

        });
    }

    query(params) {
        logger.debug(`Making db query: ${params.type} ${params.name}`);

        const db = require('../utls/db.js');
        return cache.get(`${params.name}_${params.type}`)
            .then(val => {
                //return value if not undef
                if (val) {
                    return val;
                }

                return db.find({
                        hash: params.type,
                        range: params.name
                    })
                    .then(response => {
                        cache.set(`${params.name}_${params.type}`, response);
                        return response;
                    });
            });
    }

    saveServiceAccount(params) {

        //flush cache on updates
        cache.flush();

        logger.debug(`Saving service account: ${params.name}`);

        //determine what key to encrypt
        var key = 'key';
        if (params.type === 'AWS') {
            key = 'secret';
        }

        let secret = crypto_client.encrypt_string(params[key]);
        params[key] = secret;

        const db = require('../utls/db.js');

        return db.insert(params);

    }


    getServiceAccounts(type) {

        logger.debug(`Getting service accounts: ${type}`);

        const db = require('../utls/db.js');

        return cache.get(`${type}_service_accounts`)
            .then(val => {

                if (val) {
                    return val;
                }

                return db.findAll(type)
                    .then(response => {
                        cache.set(`${type}_service_accounts`, response);
                        return response;
                    });
            });
    }

    getServiceAccount(params) {

        logger.debug(`Getting service account: ${params.type} ${params.name}`);

        const db = require('../utls/db.js');
        return cache.get(`${params.name}_${params.type}`)
            .then(val => {

                //return value if not undef
                if (val) {
                    return decrypt(val);
                }

                return db.find({
                        hash: params.type,
                        range: params.name
                    })
                    .then(response => {
                        cache.set(`${params.name}_${params.type}`, response);
                        return decrypt(response);
                    });
            });

    }

    getDefaultAws() {

        const query = {
            range: 'DEFAULT',
            hash: 'AWS'
        };
        const db = require('../utls/db.js');

        return cache.get(`AWS_${query.range}`)
            .then(val => {
                //return value if not undef
                if (val) {
                    return decrypt(val);
                }

                return db.find(query)
                    .then(response => {
                        cache.set(`AWS_${query.range}`, response);
                        return decrypt(response);
                    });
            });
    }

    deleteServiceAccount(params) {

        //flush cache on updates
        cache.flush();

        logger.debug(`Deleting service account: ${params.type} ${params.name}`);

        const db = require('../utls/db.js');

        return db.remove({
            hash: params.type,
            range: params.name
        });
    }

    getUser(name) {

        const db = require('../utls/db.js');

        return cache.get(name)
            .then(val => {

                //return value if not undef
                if (val) {
                    return val;
                }

                return db.find({
                        hash: 'USER',
                        range: name
                    })
                    .then(response => {
                        cache.set(name, response);
                        return response;
                    });

            });
    }

    updateUser(params) {

        //flush cache on updates
        cache.flush();

        logger.debug(`Updating user account ${params.type} ${params.name}`);

        const obj = _.omit(params, ['name', 'type']);
        const db = require('../utls/db.js');

        return db.update({
            hash: 'USER',
            range: params.name
        }, obj);

    }

    createUser(params) {

        //flush cache on updates
        cache.flush();

        logger.debug(`Created user account ${params.type} ${params.name}`);
        const db = require('../utls/db.js');

        return db.find({
            hash: params.type,
            range: params.name
        }).then(response => {
            if (!response) {
                return db.insert(params);
            }
            throw new Error(`User ${params.name} already exists`);
        });
    }

    deleteUser(name) {

        //flush cache on updates
        cache.flush();

        logger.debug(`Deleting user account ${name}`);
        const db = require('../utls/db.js');

        return db.remove({
            hash: 'USER',
            range: name
        });
    }

    listUsers() {

        const db = require('../utls/db.js');
        return cache.get('all_users')
            .then(users => {

                if (users) {
                    return users;
                }

                return db.findAll('USER')
                    .then(users => {
                        cache.set('all_users', users);
                        return users;
                    });
            });
    }
}



module.exports = new Config();
