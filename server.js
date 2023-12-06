/*jshint esversion: 6 */
'use strict'

const cluster = require('cluster');
const express = require('express');
const app = express();
const logger = require('./utls/logger.js');
const morgan = require('morgan');
const bodyParser = require('body-parser');

//get number of CPU's
const numCPUs = require('os').cpus().length;

// determine listening port
const listenPort = process.env.CLOUDSU_PORT || 3000;


// express configuration
// setup frontend static assets
app.use(express.static(`${__dirname}/dist`));
// json body parser
app.use(bodyParser.json({
    type: 'application/*'
}));
// url encoding parser
app.use(bodyParser.urlencoded({
    extended: true
}));
// setup winston logger
app.use(morgan('combined', {
    'stream': logger.stream
}));

//setup api router
require('./api/router.js')(app)


if (cluster.isMaster) {
    //init functions that only run on master
    //queue rida (looks for new server messages in sqs)
    require('./utls/queue_rider.js');

    //start cleanup tool (cleans up expired resources)
    require('./utls/cleanup_tool.js');

    // fork cluster to get the most of a mutli-core server
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    // listen
    app.listen(listenPort, (err, response) => {
        if (err) {
            logger.info(err);
            return
        };
        logger.info(`App listening on port ${listenPort}`);
    });
}
