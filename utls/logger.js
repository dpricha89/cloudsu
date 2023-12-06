/*jshint esversion: 6 */
'use strict';

const log_level = process.env.CLOUDSU_LOG_LEVEL || 'debug';
const winston = require('winston');
winston.emitErrs = true;


const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: log_level,
            handleExceptions: true,
            json: false,
            colorize: true,
            timestamp: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write(message, encoding) {
        logger.info(message);
    }
};
