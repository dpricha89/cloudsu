#!/usr/bin/python
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

item = {
    'environment': '<%= environment %>',
    'chef_url': '<%= url %>',
    'node_name': '<%= node_name %>',
    'key': <%= private_key %>}

#run chef setup
setup_chef(item)
