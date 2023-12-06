/*jshint esversion: 6 */
'use strict';

const token_client = require('../utls/token.js');
const logger = require('../utls/logger.js');

class AttachAwsAuth {
    constructor() {}

    run(req, res, next) {

        const config = require('../config/config.js');
        const token = req.headers.token || req.body.token;

        if (!token) {
            return res.redirect('/login');
        }

        return token_client.verify(token)
            .then(response => {
                logger.debug('verified token for user:', response.name);
                return config.getUser(response.name)
                    .then(user => {
                        req.user = user;
                        return next();
                    });
            })
            .catch(err => {
                logger.error(err);
                res.status(401).json('not authorized');
            });
    }
}

module.exports = new AttachAwsAuth();
