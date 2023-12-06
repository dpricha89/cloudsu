
# CloudSu

###### Designed to simplify the process of deploying highly available applications.
#
###### Requirements:
- Chef Server https://manage.chef.io/login
- AWS Account https://aws.amazon.com/
- Node: Tested 4.0.0
- NPM: Tested 2.14.2

### Why should I use CloudSu?
CloudSu gets you started with chef in the AWS cloud in just a few minutes. Launching servers is as easy as filling out a form and all the chef tasks are automatically taken care of for you.

### What will CloudSu create on my AWS account
CloudSu uses CloudFormation to create all of its resources so cleanup is a breeze. All resources created below will fall under the AWS Free Tier
- DynamoDB Config Table - Accounts and settings data
- DynamoDB Servers Table - Server Chef client key storage
- SQS Queue - Used to store autoscale events
- SNS Topic - Used for capturing autoscale events
- IAM Config User - Full-access account for settings and accounts
- IAM Server User - Read-only account for server table

### How does CloudSu work
When you click create a new stack a few things happen in this order

1. A CloudFormation template is generated with all the options you chose in the form
2. A custom bootstrap is inserted into the CloudFormation template metadata
3. The CloudFormation template is sent to AWS to be created
4. A Chef environment is created with the same name as the CloudFormation stack with the options your chose in the form
5. CloudSU polls the SQS queue for new SNS events and finds the launch event for your new server(s)
6. A Chef client key is created for the launch event and placed in the DynamoDB Servers Table
7. The server(s) boot up script looks in the DynamoDB Servers Table with its InstanceId and copies the key to local disk
8. Chef is then installed on the server and a chef-client is initiated with the supplied run list in the stack form  

### What happens when I upgrade
CloudSu was designed to create new servers for each software release. The upgrade happens in this order to eliminate downtime and to provide a rollback option if needed.

Stage1:
- Creates the new server(s)
- Locks the previous software version at the chef node level for the old servers
- Updates the chef environment to the new software version
- Waits for the CloudFormation to return an UPDATE_COMPLETE status

Stage2: Connects the new server(s) to the load balancer

Stage3: Disconnects the old server(s) from the load balancer

Stage4: Cleans up your old servers or tags them for termination in the future     

### Setup:
```bash

$ npm install

$ node server.js

```

### Environment Variables:

#### Redis cache (local cache will be used if REDIS_HOST is not set)  
* REDIS_HOST - IP address or hostname of your Redis server
* REDIS_PORT - Redis server port
* REDIS_PASSWORD - Redis password for authentication (not required)

#### Application settings
* CLOUDSU_PORT - Http listening port for the server (default: 3000)
* CLOUDSU_LOG_LEVEL - Winston log level (default: debug)
* CLOUDSU_ENCYPTION_KEY - Encryption key used to encrypt and decrypt items in the database

### API:

#### Headers (needed for each request)
```json
{
  "aws_region": "us-west-2",
  "aws_account": "DEFAULT",
  "token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiZHByaWNoYTE4OUBnbWFpbC5jb20iLCJpYXQiOjE0NjE2NDA1NTIsImV4cCI6MTQ2MTcyNjk1Mn0.EDxmnM_1H91H115grMxasdfasdfasdfaseeONMPc4wsGxI"
}
```

#### Create Stack
##### POST /api/v1/stacks/:stack_name
```json
{
  "stack_name": "Testing",
  "instance_store": false,
  "ebs_volume": false,
  "multi_az": true,
  "ebs_root_size": 30,
  "volumes": [{ "type": "gp2", "size": 30 }],
  "recipes": ["recipe[nodejs]"],
  "build_size": "HA",
  "create_elb": true,
  "route_53": true,
  "hosted_zone": "cloudsu.io",
  "ebs_root_volume": true,
  "elb":{
     "ping_port": 443,
     "ping_protocol": "HTTPS",
     "ping_path": "/api/v1/status"
  },
  "min_size": 1,
  "desired_size": 1,
  "max_size": 3,
  "instance_size": "t2.nano",
  "key": "gator",
  "ami": "ami-c229c0a2",
  "app_name": "cloudsu",
  "app_version": "prod-1413",
  "domain": "cloudsu.io",
  "regions": ["us-west-2a", "us-west-2b", "us-west-2c"],
  "elb_security_groups": ["sg-adb4b6c8"],
  "security_groups": ["sg-adb4b6c8"]
 }
```

#### Upgrade Stack All Stages
##### PATCH /api/v1/upgrade
```json
{
  "stack_name": "Testing",
  "min_size": 1,
  "desired_size": 1,
  "max_size": 3,
  "ami": "ami-c229c0a2",
  "instance_size": "t2.nano",
  "app_version": "prod13",
  "cleanup_type": "delete"
}
```

#### Upgrade Stack Stage 1
##### PATCH /api/v1/upgrade/stage1
```json
{
  "stack_name": "Testing",
  "min_size": 1,
  "desired_size": 1,
  "max_size": 3,
  "ami": "ami-c229c0a2",
  "instance_size": "t2.nano",
  "app_version": "prod13"
}
```

#### Upgrade Stack Stage 2
##### PATCH /api/v1/upgrade/stage2
```json
{
  "stack_name": "Testing"
}
```

#### Upgrade Stack Stage 3
##### PATCH /api/v1/upgrade/stage3
```json
{
  "stack_name": "Testing",
}
```

#### Upgrade Stack Stage 4
##### PATCH /api/v1/upgrade/stage4
```json
{
  "stack_name": "Testing",
  "cleanup_type": "delete"
}
```

#### Delete Stack
##### DELETE /api/v1/stacks/:stack_name
