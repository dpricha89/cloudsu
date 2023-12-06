/*jshint esversion: 6 */
'use strict';

const err_handler = require('../../utls/error_handler.js');
const logger = require('../../utls/logger.js');

class Chef {
    constructor() {}

    createEnvironment(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.createEnvironment(req.body)
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

    getEnvironment(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getEnvironment(req.params.environment)
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

    getEnvironments(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getEnvironments()
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

    getEnvironmentNodes(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getEnvironmentNodes(req.params.environment)
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

    updateEnvironment(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.updateEnvironment(req.body)
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

    deleteEnvironment(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.deleteEnvironment(req.params.environment)
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

    rollbackCheck(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.rollbackCheck(req.params.environment)
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

    createNode(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.createNode(req.body)
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

    getNode(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getNode(req.params.node)
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

    updateNode(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.updateNode(req.body)
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

    deleteNode(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.deleteNode(req.params.node)
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

    createClient(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.createClient(req.params.client)
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

    getClient(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getClient(req.params.client)
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

    deleteClient(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.deleteClient(req.params.client)
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

    createDataBag(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.createDataBag(req.params.data_bag)
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

    getDataBag(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getDataBag(req.params.data_bag)
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

    getDataBagItem(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.getDataBagItem(req.params.data_bag, req.params.item)
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

    saveDataBagItem(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.saveDataBagItem(req.params.data_bag, req.params.item)
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

    recipes(req, res) {

        const chef_account = req.cms;
        const chef_client = require('../clients/chef_client.js');
        chef_client.init(chef_account);

        return chef_client.recipes()
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


module.exports = new Chef();
