/*jshint esversion: 6 */
'use strict';

const logger = require('../../utls/logger.js');
const err_handler = require('../../utls/error_handler.js');
const _ = require('underscore');


class Accounts {
    constructor() {}

    attemptLogin(req, res) {

        const accounts_client = require('../clients/accounts_client.js');
        const params = req.body;

        return accounts_client.checkPassword(params.name, params.password)
            .then(user => {
                res.status(200)
                    .json(user);
            })
            .catch(err => {
                logger.error(err);
                res.status(401)
                    .json(err_handler(err));
            });
    }

    resetPassword(req, res) {

        const accounts_client = require('../clients/accounts_client.js');

        return accounts_client.resetPassword(req.user.name, req.body.password)
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    update(req, res) {

        if (!req.user.admin) {
            // send error if user is not an admin
            res.status(403)
                .json(`${req.user.name} is not in the admin group`);
            return;
        }

        const config = require('../../config/config.js');

        if (!req.body.name) {
            req.body = _.extend(req.user, req.body);
        }

        return config.updateUser(req.body)
            .then(user => {
                res.status(200)
                    .json(user);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    create(req, res) {

        if (!req.user.admin) {
            // send error if user is not an admin
            res.status(403)
                .json(`${req.user.name} is not in the admin group`);
            return;
        }

        const accounts_client = require('../clients/accounts_client.js');
        const params = req.body;

        return accounts_client.create(params)
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    delete(req, res) {

        const name = req.params.name;

        if (req.user.name === name) {
            //user cannot delete themselves
            res.status(403)
                .json(`You cannot delete yourself. Login as another user to delete: ${name}`);
            return;
        } else if (!req.user.admin) {
            //cannot delete unless user is an admin
            res.status(403)
                .json(`${req.user.name} is not in the admin group`);
            return;
        }

        const accounts_client = require('../clients/accounts_client.js');

        return accounts_client.delete(name)
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    list(req, res) {

        if (!req.user.admin) {
            // user cannot see users list unless they are apart of admin group
            res.status(403)
                .json(`${req.user.name} is not in the admin group`);
            return;
        }

        const accounts_client = require('../clients/accounts_client.js');

        return accounts_client.list()
            .then(users => {
                res.status(200)
                    .json(users);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }

    checkToken(req, res) {

        const accounts_client = require('../clients/accounts_client.js');
        const token = req.params.token;

        return accounts_client.checkToken(token)
            .then(response => {
                logger.info(response);
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });

    }

    getServiceToken(req, res) {

        if (!req.user.admin) {
            // only admins can create auth tokens
            res.status(403)
                .json(`${req.user.name} is not in the admin group`);
            return;
        }

        const accounts_client = require('../clients/accounts_client.js');

        return accounts_client.getServiceToken(req.user)
            .then(response => {
                res.status(200)
                    .json(response);
            })
            .catch(err => {
                logger.error(err);
                res.status(500)
                    .json(err_handler(err));
            });
    }
}

module.exports = new Accounts();
