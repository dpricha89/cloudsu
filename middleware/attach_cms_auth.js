/*jshint esversion: 6 */
'use strict';

class AttachCmsAuth {
    constructor() {}

    run(req, res, next) {

        const config = require('../config/config.js');

        return config.getServiceAccount({
                name: 'DEFAULT',
                type: 'CMS'
            })
            .then(response => {
                req.cms = response;
                return next();
            });

    }
}


module.exports = new AttachCmsAuth();
