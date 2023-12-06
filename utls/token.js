'use strict';

const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const logger = require('./logger.js');
const key = process.env.CLOUDSU_ENCYPTION_KEY || 'gbXQ2y+8cpl63n&';



class Token {
    constructor() {}

    sign(name) {
        logger.info(`signing token for: ${name}`);
        return jwt.sign({
            name: name
        }, key, {
            expiresIn: '24h'
        });
    }

    verify(token) {

        return new Promise(function(resolve, reject) {

                jwt.verify(token, key, (err, decoded) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(decoded);
                });

            })
            .catch(err => {
                throw new Error('Verifying token');
            });

    }

    create(user) {

        return new Promise(function(resolve, reject) {

            logger.info(`Creating token for: ${user.name}`);

            const token = jwt.sign({
                name: user.name
            }, key);

            return resolve(token);

        });
    }
}


module.exports = new Token();
