/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const generatePassword = require('password-generator');
const crypto_client = require('../../utls/crypto_client.js');
const token_client = require('../../utls/token.js');
const email_client = require('../../utls/email.js');
const logger = require('../../utls/logger.js');
const path = require('path');
const fs = require('fs');

class AccountsClient {
    constructor() {}

    checkPassword(name, password) {
        // add config client
        const config = require('../../config/config.js');

        //validate email
        if (!name) {
            throw 'Email could not be validated';
        }

        // check password against db
        return config.getUser(name)
            .then(user => {

                if (!user) {
                    throw 'Incorrect email and password combination';
                } else if (crypto_client.check_password(user.hash, password)) {
                    logger.info(`Successful login attempt: ${name}`);
                    user.token = token_client.sign(user.name);
                    return user;
                } else {
                    logger.error(`Failed login attempt: ${name}`);
                    throw 'Incorrect email and password combination';
                }

            });
    }

    resetPassword(name, password) {
        // add config client
        const config = require('../../config/config.js');

        // change users password
        return config.getUser(name)
            .then(user => {
                user.hash = crypto_client.encrypt(password);
                return config.updateUser(user);
            });
    }

    create(user) {
        // add config client
        const config = require('../../config/config.js');

        //createUser
        if (user.user_type === 'Service') {
            return token_client.create(user)
                .then(token => {
                    user.admin = true;
                    user.service_token = token;
                    return config.createUser(user);
                })
                .then(() => {
                    return user;
                });
        } else if (user.email_pass) {
            //generate password
            user.password = generatePassword(12, false);
            const email_msg = ['Your temporary password is:', user.password].join(' ');
            email_client.fire(user.name, email_msg);
        }
        user.hash = crypto_client.encrypt(user.password);
        user = _.omit(user, ['password', 'confirm']);
        return config.createUser(user);
    }

    delete(name) {
        // add config client
        const config = require('../../config/config.js');

        // remove account name variable should be an email
        return config.deleteUser(name);
    }

    list() {
        // add config client
        const config = require('../../config/config.js');
        // list all users
        return config.listUsers();
    }

    checkToken(token) {

        return new Promise(function (resolve, reject) {

            fs.readFile(path.resolve(__dirname, '../../secrets.json'), function read(err, data) {

                if (err) {
                    return resolve({
                        login: false,
                        setup: false
                    });
                } else if (!token) {
                    return resolve({
                        login: false,
                        setup: true
                    });
                }

                return token_client.verify(token)
                    .then(response => {
                        return resolve({
                            login: true,
                            setup: true
                        });
                    })
                    .catch(err => {
                        return resolve({
                            login: false,
                            setup: true
                        });
                    });

            });

        });

    }

    getServiceToken(user) {

        // add config client
        const config = require('../../config/config.js');

        return new Promise(function (resolve, reject) {
            //check if token already exists and return
            if (user.service_token) {
                return resolve(user.service_token);
            }

            //create new service token and saves to db
            return token_client.create(user)
                .then(token => {
                    user.service_token = token;
                    return config.updateUser(user);
                })
                .then(() => {
                    return resolve(user.service_token);
                })
                .catch(err => {
                    return reject(err);
                });

        });
    }
}


module.exports = new AccountsClient();
