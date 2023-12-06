#!/usr/bin/python

import boto3
import urllib2
import time
import os


# setup chef config files
def setup_chef(item):

    # make sure chef config dir is ready
    chef_config_dir = '/etc/chef'
    if not os.path.exists(chef_config_dir):
        os.makedirs(chef_config_dir)

    # write chef auth key to file
    target = open('/etc/chef/key.pem', 'w')
    target.write(item['key'])
    target.close()

    # write chef config to file
    target = open('/etc/chef/client.rb', 'w')
    target.write('environment "' + item['environment'] + '"\n')
    target.write('chef_server_url "' + item['chef_url'] + '"\n')
    target.write('node_name "' + item['node_name'] + '"\n')
    target.write('client_key  "/etc/chef/key.pem"\n')
    target.close()

# setup boto
instance_id = urllib2.urlopen(
    'http://169.254.169.254/latest/meta-data/instance-id').read()
session = boto3.session.Session(aws_access_key_id='<%= AccessKeyId %>',
                                aws_secret_access_key='<%= SecretAccessKey %>',
                                region_name='<%= region %>')
dynamodb = session.resource("dynamodb")
table = dynamodb.Table('cloudsu_servers')
timeout = time.time() + 60 * 5   # 5 minutes from now

# print instance id for debug purposes
print 'bootstrapping instance ' + instance_id

# pull setup info from dynamodb
while True:
    if time.time() > timeout:
        break
    response = table.get_item(
        Key={
            'instance_id': instance_id
        })
    if 'Item' in response:
        setup_chef(response['Item'])
        break
    time.sleep(5)
