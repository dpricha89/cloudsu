/*jshint esversion: 6 */
'use strict';

const fs = require('fs');
const _ = require('underscore');
const path = require('path');
const logger = require('../../utls/logger.js');

//clients
const ec2_client = require('./ec2_client.js');
const chef_client = require('./chef_client.js');
const config_client = require('../../config/config.js');

// templates
const ASG = fs.readFileSync(path.resolve(__dirname, '../../templates/ASG/asgtemplate.json'), 'utf8');
const ELB = fs.readFileSync(path.resolve(__dirname, '../../templates/ELB/elbtemplate.json'), 'utf8');
const EC2 = fs.readFileSync(path.resolve(__dirname, '../../templates/EC2/ec2template.json'), 'utf8');
const LC = fs.readFileSync(path.resolve(__dirname, '../../templates/LaunchConfig/launchtemplate.json'), 'utf8');
const ROUTE_53 = fs.readFileSync(path.resolve(__dirname, '../../templates/Route53/Route53.json'), 'utf8');
const SHELL_TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../../templates/Shell/shell.json'), 'utf8');
const WH = fs.readFileSync(path.resolve(__dirname, '../../templates/WH/wh.json'), 'utf8');
const WC = fs.readFileSync(path.resolve(__dirname, '../../templates/WC/wc.json'), 'utf8');
const USER_DATA = fs.readFileSync(path.resolve(__dirname, '../../templates/Scripts/userdata.json'), 'utf8');
const META_DATA = fs.readFileSync(path.resolve(__dirname, '../../templates/Scripts/metadata.json'), 'utf8');
const CPU_HIGH = fs.readFileSync(path.resolve(__dirname, '../../templates/CPU/high.json'), 'utf8');
const CPU_LOW = fs.readFileSync(path.resolve(__dirname, '../../templates/CPU/low.json'), 'utf8');
const SP_DOWN = fs.readFileSync(path.resolve(__dirname, '../../templates/ScalePolicy/ScaleDown.json'), 'utf8');
const SP_UP = fs.readFileSync(path.resolve(__dirname, '../../templates/ScalePolicy/ScaleUp.json'), 'utf8');
const BOOTSTRAP = fs.readFileSync(path.resolve(__dirname, '../../templates/Scripts/bootstrap.py'), 'utf8');
const BOOTSTRAP_HA = fs.readFileSync(path.resolve(__dirname, '../../templates/Scripts/bootstrap_ha.py'), 'utf8');

// utls
const utls = require('../../utls/utilities.js');


class ConstructTemplate {
    constructor() {}

    get(templateBody, params) {

        let template;

        if (templateBody) {
            template = JSON.parse(templateBody);
        } else {
            template = JSON.parse(SHELL_TEMPLATE);
        }

        const self = this;

        return config_client.query({
                name: 'DEFAULT',
                type: 'TOPIC'
            })
            .then(topic => {

                if (params.build_size === 'Single') {
                    return self.get_single_template(template, params);
                }

                return self.get_ha_template(template, params, topic.arn);

            });

    }

    get_ha_template(template, params, topic_arn) {


        const secure = require('../../config/secure_config');
        const client_db = secure.get('db_client');

        return this.build_volumes(params)
            .then(volumes => {
                //dns
                params.dns = [params.stack_name, '-', params.app_name, '.', params.domain].join('');

                //Setup nginx/apache proxy
                params.first_boot = {
                    proxy: {}
                };
                params.first_boot.proxy[params.app_name] = params.dns;

                // cleanup names
                params = utls.remove_non_alpha(params);

                // set wait handle callback
                params.node_name = `${params.stack_name}-${params.app_name}`;
                params.wc_ref = `LC${params.app_name}${params.app_version}`;
                params.wh_name = `WH${params.app_name}`;
                params.dns_ref = `ELB${params.app_name}${params.app_version}`;
                params.dns_type = 'DNSName';

                //add client db creds
                let bootstrap = _.template(BOOTSTRAP_HA);
                bootstrap = bootstrap(client_db);

                // push asg params into template
                let asg = _.template(ASG);
                asg = JSON.parse(asg(params));

                // wc and wh
                let lc = _.template(LC);
                lc = JSON.parse(lc(params));
                let wc = _.template(WC);
                wc = wc(params);


                // cpu
                let cpu_high = _.template(CPU_HIGH);
                cpu_high = cpu_high(params);
                let cpu_low = _.template(CPU_LOW);
                cpu_low = cpu_low(params);


                // scale policies
                let spu = _.template(SP_UP);
                spu = spu(params);
                let spd = _.template(SP_DOWN);
                spd = spd(params);


                let userdata = _.template(USER_DATA);
                userdata = JSON.parse(userdata(params));
                lc.Properties.UserData = userdata;
                let metadata = _.template(META_DATA);
                metadata = JSON.parse(metadata(params));
                metadata['AWS::CloudFormation::Init']['chef_register']['files']['/etc/chef/first-boot.json'].content = params.first_boot;
                metadata['AWS::CloudFormation::Init']['chef_register']['files']['/tmp/bootstrap.py'].content = String(bootstrap);
                lc.Metadata = metadata;
                lc.Properties.BlockDeviceMappings = volumes;

                if (params.iam_role) {
                    lc.Properties.IamInstanceProfile = params.iam_profile;
                }


                const suffix = params.app_name + params.app_version;

                //set asg desired size
                asg.Properties.DesiredCapacity = params.desired_size || params.min_size;

                lc.Properties.SecurityGroups = params.security_groups;
                if (params.multi_az) {
                    asg.Properties.AvailabilityZones = params.regions;
                } else {
                    asg.Properties.AvailabilityZones = params.regions;
                }

                //add sns topic
                asg.Properties.NotificationConfigurations = [{
                    TopicARN: topic_arn,
                    NotificationTypes: [
                        'autoscaling:EC2_INSTANCE_LAUNCH',
                        'autoscaling:EC2_INSTANCE_TERMINATE'
                    ]
                }];


                // add auto scale group and launch config to template
                template.Resources[`ASG${suffix}`] = asg;
                template.Resources[`LC${suffix}`] = lc;
                // add cpu alerts to template
                template.Resources[`CPUH${suffix}`] = JSON.parse(cpu_high);
                template.Resources[`CPUL${suffix}`] = JSON.parse(cpu_low);
                // add scale policy to template
                template.Resources[`SPU${suffix}`] = JSON.parse(spu);
                template.Resources[`SPD${suffix}`] = JSON.parse(spd);
                // add wait condition to template
                template.Resources[`WC${suffix}`] = JSON.parse(wc);

                if (params.type === 'create' || params.type === 'add') {

                    //only create elb if it is requested
                    if (params.elb) {
                        // elb
                        params.dns_ref = `ELB${params.app_name}`;
                        let elb = _.template(ELB);
                        elb = JSON.parse(elb(params));
                        elb.Properties.SecurityGroups = params.elb_security_groups;

                        // multi az settings for ELB
                        if (params.multi_az) {
                            elb.Properties.CrossZone = true;
                            elb.Properties.AvailabilityZones = params.regions;
                        } else {
                            elb.Properties.AvailabilityZones = params.regions;
                        }

                        // add cert and listener for ssl
                        if (params.ssl_cert) {
                            const https_config = {
                                LoadBalancerPort: '443',
                                InstanceProtocol: 'HTTPS',
                                InstancePort: '443',
                                Protocol: 'HTTPS',
                                SSLCertificateId: params.ssl_cert
                            };
                            elb.Properties.Listeners.push(https_config);
                        }

                        // add to template
                        template.Resources[`ELB${params.app_name}`] = elb;

                    }
                    //add route 53 to template
                    if (params.route_53) {
                        // dns
                        let route_53 = _.template(ROUTE_53);
                        route_53 = route_53(params);
                        template.Resources[`DNS${params.app_name}`] = JSON.parse(route_53);
                    }

                    // add wait condition to template
                    template.Resources[params.wh_name] = JSON.parse(WH);
                }

                logger.info(`Addiing stack with resources: ${_.keys(template.Resources)}`);
                return JSON.stringify(template);
            });

    }

    get_single_template(template, params) {

        const secure = require('../../config/secure_config');
        const client_db = secure.get('db_client');
        chef_client.init(params.cms);
        const client_body = {
            'name': `${params.stack_name}-instance`,
            'admin': false,
            'create_key': true
        };

        //load templates
        return this.build_volumes(params)
            .then(volumes => {
                params.volumes = volumes;
                return chef_client.createClient(client_body);
            })
            .then(client_key => {

                //check if key is empty
                if (!client_key.private_key) {
                    throw new Error(`chef client key could not be created ${client_body.name}`);
                }

                let bootstrap = _.template(BOOTSTRAP);
                let wc = _.template(WC);
                let userdata = _.template(USER_DATA);
                let metadata = _.template(META_DATA);
                let route_53 = _.template(ROUTE_53);
                let ec2 = _.template(EC2);

                if (params.route_53) {
                    // create dns name stack_name + domain
                    params.wc_ref = 'instance';
                    params.dns_type = 'PrivateDnsName';
                    params.dns = [params.stack_name, '.', params.domain].join('');
                    route_53 = route_53(params);
                    template.Resources[`DNS${params.wc_ref}`] = JSON.parse(route_53);
                }

                params.node_name = `${params.stack_name}-instance`;
                params.wc_ref = 'instance';
                params.dns_ref = 'instance';
                params.wh_name = ['WH', params.wc_ref].join('');

                //Setup nginx/apache proxy
                params.first_boot = {
                    proxy: {}
                };
                params.first_boot.proxy[params.app_name] = params.dns;

                ec2 = JSON.parse(ec2(params));
                ec2.Properties.AvailabilityZone = params.regions;
                ec2.Properties.BlockDeviceMappings = params.volumes;

                if (params.iam_profile) {
                    ec2.Properties.IamInstanceProfile = params.iam_profile;
                }

                //boot strap params
                const bootstrap_params = _.extend(client_db, params.cms, {
                    environment: params.stack_name,
                    node_name: params.node_name,
                    private_key: JSON.stringify(client_key.private_key)
                });
                bootstrap = bootstrap(bootstrap_params);


                // wc
                wc = wc(params);

                // add userdata
                userdata = JSON.parse(userdata(params));
                ec2.Properties.UserData = userdata;
                ec2.Properties.SecurityGroupIds = params.security_groups;

                // add metadata
                metadata = JSON.parse(metadata(params));
                metadata['AWS::CloudFormation::Init']['chef_register']['files']['/etc/chef/first-boot.json'].content = params.first_boot;
                metadata['AWS::CloudFormation::Init']['chef_register']['files']['/tmp/bootstrap.py'].content = String(bootstrap);
                ec2.Metadata = metadata;
                template.Resources[params.wc_ref] = ec2;

                // add wait condition to template
                template.Resources[params.wh_name] = JSON.parse(WH);
                template.Resources[`WC${params.wc_ref}`] = JSON.parse(wc);

                logger.info(`Addiing stack with resources: ${_.keys(template.Resources)}`);
                return JSON.stringify(template);

            });
    }


    build_volumes(params) {

        return ec2_client.instanceStoreMap()
            .then(map => {
                const size = _.clone(params.instance_size)
                    .replace('.', '_');
                const ephemeral_disks = map[size];
                const BlockDeviceMappings = [];
                if (ephemeral_disks && params.instance_store) {
                    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
                    _.each(ephemeral_disks, (disk, index) => {

                        const character = alphabet[index];

                        BlockDeviceMappings.push({
                            DeviceName: `/dev/sd${character}`,
                            VirtualName: disk
                        });

                    });
                }
                return BlockDeviceMappings;
            })
            .then(BlockDeviceMappings => {

                if (params.ebs_root_volume) {
                    BlockDeviceMappings.push({
                        DeviceName: '/dev/xvda',
                        Ebs: {
                            VolumeSize: params.ebs_root_size,
                            VolumeType: 'gp2',
                            DeleteOnTermination: true
                        }
                    });
                }

                return BlockDeviceMappings;
            })
            .then(BlockDeviceMappings => {
                if (params.volumes) {
                    const alphabet = 'fghijklmnop';
                    _.each(params.volumes, (disk, index) => {
                        const character = alphabet[index];
                        BlockDeviceMappings.push({
                            DeviceName: `/dev/sd${character}`,
                            Ebs: {
                                VolumeSize: disk.size,
                                VolumeType: disk.type,
                                DeleteOnTermination: true
                            }
                        });
                    });
                }

                return BlockDeviceMappings;
            });
    }
}

module.exports = new ConstructTemplate();
