'use strict';

const Promise = require('bluebird');
const exec = require('child_process').exec;
const logger = require('./logger.js');

class utls_client {
    constructor() {}

    remove_non_alpha(app) {

        app.app_name = app.app_name.replace(/\W/g, '');

        if (app.version) {
            app.version = app.version.replace(/\W/g, '');
        }

        if (app.app_version) {
            app.app_version = app.app_version.replace(/\W/g, '');
        }

        return app;

    }

    clean_node_name(node) {

        const node_arr = node.split('-');
        return `${node_arr[ 0 ]}-${node_arr[ 1 ]}`;

    }

    run_cmd(cmd) {

        logger.info(`Running command: ${cmd}`);
        return new Promise(function(resolve, reject) {
            exec(cmd, (error, stdout, stderr) => {
                if (error && error.code !== 0) {
                    const details = {
                        stdout: stdout,
                        stderr: stderr,
                        error: error
                    };

                    return reject(details);
                } else {
                    return resolve(stdout);
                }
            });

        });

    }
}

module.exports = new utls_client();
