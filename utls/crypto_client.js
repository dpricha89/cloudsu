/*jshint esversion: 6 */
'use strict';

const Promise = require('bluebird');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const algorithm = 'aes256';
const key = process.env.CLOUDSU_ENCYPTION_KEY || 'gbXQ2y+8cpl63n&';

class crypto_client {
    constructor() {}

    encrypt(password) {

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        return hash;

    }

    check_password(hash, password) {
        //check password against hash from DB
        return bcrypt.compareSync(password, hash);

    }

    encrypt_string(string) {
        const cipher = crypto.createCipher(algorithm, key);
        return cipher.update(string, 'utf8', 'hex') + cipher.final('hex');
    }

    decrypt_string(string) {
        return new Promise(function(resolve, reject) {
            const decipher = crypto.createDecipher(algorithm, key);
            const result = decipher.update(string, 'hex', 'utf8') + decipher.final('utf8');
            return resolve(result);
        });
    }
}

module.exports = new crypto_client();
