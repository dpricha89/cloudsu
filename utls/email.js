/*jshint esversion: 6 */
'use strict';

/*
Used for sending randomly generated passwords to new users
*/

const nodemailer = require('nodemailer');
const logger = require('./logger.js');
// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport();
// setup defualt e-mail data
var mailOptions = {
    from: '"cloudsu" <no-reply@cloudsu.io>', // sender address
    subject: 'New Account ✔', // Subject line
};


class EmailClient {
    constructor() {}

    fire(email, msg) {
        mailOptions.to = email;
        mailOptions.text = msg;
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return logger.error(error);
            }
            logger.info(`New user message sent: ${email}`);
        });

    }

}

module.exports = new EmailClient();
