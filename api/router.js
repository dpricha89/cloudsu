/*jshint esversion: 6 */
'use strict';

// clients
const ec2 = require('./routes/ec2.js');
const accounts = require('./routes/accounts.js');
const main = require('./routes/main.js');
const stacks = require('./routes/stacks.js');
const autoscale = require('./routes/autoscale.js');
const sqs = require('./routes/sqs.js');
const sns = require('./routes/sns.js');
const chef = require('./routes/chef.js');
const elb = require('./routes/elb.js');
const setup = require('./routes/setup.js');
const upgrade = require('./routes/upgrade.js');

//middleware
const attach_aws_auth = require('../middleware/attach_aws_auth.js');
const attach_cms_auth = require('../middleware/attach_cms_auth.js');
const check_token = require('../middleware/check_token.js');


module.exports = function (app) {

    //unauthenticated requests
    app.post('/api/v1/setup/:name', setup.run);
    app.post('/api/v1/accounts/login', accounts.attemptLogin);
    app.get('/api/v1/ping/:token', accounts.checkToken);
    app.get('/api/v1/region', main.region);
    app.get('/api/v1/regions', main.regions);
    app.get('/api/v1/bucket_regions', main.bucketRegions);
    app.get('/api/v1/region_map', main.regionMap);
    app.post('/api/v1/system/import', main.importConfig);
    app.get('/api/v1/services/list', main.getServiceList);

    //require auth here
    app.use(check_token.run);
    app.use(attach_aws_auth.run);
    app.use(attach_cms_auth.run);

    //Everything below requires authentication

    //accounts
    app.get('/api/v1/accounts/token', accounts.getServiceToken);
    app.put('/api/v1/accounts/reset', accounts.resetPassword);
    app.get('/api/v1/accounts', accounts.list);
    app.post('/api/v1/accounts', accounts.create);
    app.put('/api/v1/accounts', accounts.update);
    app.delete('/api/v1/accounts/:name', accounts.delete);

    //stacks
    app.get('/api/v1/stacks', stacks.listStacks);
    app.get('/api/v1/stacks/:stack_name', stacks.stack);
    app.get('/api/v1/stacks/status/:stack_name', stacks.stackStatus);
    app.post('/api/v1/stacks/:stack_name', stacks.createStack);
    app.delete('/api/v1/stacks/:stack_name', stacks.deleteStack);
    app.put('/api/v1/stacks/:stack_name', stacks.updateStack);
    app.get('/api/v1/stacks/describe/:stack_name', stacks.describe);
    app.get('/api/v1/stacks/template/:stack_name', stacks.getTemplate);
    app.get('/api/v1/stacks/describeEvents/:stack_name', stacks.describeEvents);

    //stack scale group
    app.patch('/api/v1/delete_asg', stacks.deleteAsg);
    app.patch('/api/v1/adjust_size', stacks.adjustSize);

    //upgrade
    app.patch('/api/v1/upgrade', upgrade.full);
    app.patch('/api/v1/upgrade/stage1', upgrade.stage1);
    app.patch('/api/v1/upgrade/stage2', upgrade.stage2);
    app.patch('/api/v1/upgrade/stage3', upgrade.stage3);
    app.patch('/api/v1/upgrade/stage4', upgrade.stage4);
    app.patch('/api/v1/upgrade/rollback', upgrade.rollback);

    //sqs
    app.post('/api/v1/sqs/create/:QueueName', sqs.createQueue);
    app.post('/api/v1/sqs/setup', sqs.initialSetup);

    //autoscale groups
    app.put('/api/v1/asg/adjustSize/:asg_group', autoscale.adjustSize);
    app.get('/api/v1/asg/describe/:groups', autoscale.describeAutoScalingGroups);

    //iam
    app.get('/api/v1/iam/ssl', main.listServerCertificates);
    app.get('/api/v1/iam/roles', main.listInstanceProfiles);

    //ec2
    app.get('/api/v1/ec2/images', ec2.describeImages);
    app.get('/api/v1/ec2/sizes', ec2.sizes);
    app.get('/api/v1/ec2/keys', ec2.describeKeyPairs);
    app.get('/api/v1/ec2/security_groups', ec2.describeSecurityGroups);
    app.get('/api/v1/ec2/:instances', ec2.instances);
    app.get('/api/v1/ec2/instances/:stack_name', ec2.instancesByStack);
    app.get('/api/v1/ec2/sample/images', ec2.sampleImages);
    app.get('/api/v1/ec2/instance_store/map', ec2.instanceStoreMap);


    //sns
    app.post('/api/v1/sns/create_topic/:topic_name', sns.createTopic);
    app.post('/api/v1/sns/confirm', sns.confirmSubscription);
    app.post('/api/v1/sns/subscribe', sns.subscribe);

    //chef environments
    app.post('/api/v1/chef/environments', chef.createEnvironment);
    app.get('/api/v1/chef/environments/:environment', chef.getEnvironment);
    app.get('/api/v1/chef/environments', chef.getEnvironments);
    app.get('/api/v1/chef/rollback_check/:environment', chef.rollbackCheck);
    app.get('/api/v1/chef/:environment/nodes', chef.getEnvironmentNodes);
    app.put('/api/v1/chef/environments/update', chef.updateEnvironment);
    app.delete('/api/v1/chef/environments/:environment', chef.deleteEnvironment);

    //chef nodes
    app.post('/api/v1/chef/nodes/:node', chef.createNode);
    app.put('/api/v1/chef/nodes/:node', chef.updateNode);
    app.get('/api/v1/chef/nodes/:node', chef.getNode);
    app.delete('/api/v1/chef/nodes/:node', chef.deleteNode);

    //chef clients
    app.post('/api/v1/chef/clients/:client', chef.createClient);
    app.get('/api/v1/chef/clients/:client', chef.getClient);
    app.delete('/api/v1/chef/clients/:client', chef.deleteClient);

    //chef data bags
    app.post('/api/v1/chef/create/:data_bag', chef.createDataBag);
    app.get('/api/v1/chef/data/:data_bag', chef.getDataBagItem);
    app.get('/api/v1/chef/data/:data_bag/:item', chef.getDataBagItem);
    app.put('/api/v1/chef/data/:data_bag/:item', chef.saveDataBagItem);

    //chef recipes
    app.get('/api/v1/chef/recipes', chef.recipes);

    //export config
    app.get('/api/v1/system/export', main.exportConfig);

    //service account
    app.delete('/api/v1/services/:type/:name', main.deleteServiceAccount);
    app.post('/api/v1/services/save_account', main.saveServiceAccount);
    app.get('/api/v1/services/get_accounts/:type', main.getServiceAccounts);
    app.get('/api/v1/services/get_account/:type/:name', main.getServiceAccount);

    //elb
    app.patch('/api/v1/elb/disconnect', elb.disconnectElb);
    app.patch('/api/v1/elb/connect', elb.connectElb);
    app.get('/api/v1/elb/:elbs', elb.getElbs);
    app.get('/api/v1/available_elbs/:stack_name', elb.getAvailableElbs);

};
