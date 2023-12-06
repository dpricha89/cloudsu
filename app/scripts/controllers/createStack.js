angular
    .module('stacks')
    .controller('createStack', function ($scope, $http, $state, $uibModalInstance, dataStore, _, toastr) {

        $scope.sgs = [];
        $scope.elb_sgs = [];
        $scope.stack = {};
        $scope.stack.instance_store = false;
        $scope.stack.ebs_volume = false;
        $scope.stack.multi_az = false;
        $scope.stack.type = 'create';
        $scope.stack.ebs_root_size = 30;
        $scope.showSpinner = false;
        $scope.stack.volumes = [];
        $scope.stack.recipes = [];
        $scope.activeTab = 'stack-tab';
        $scope.last_name;

        //stub chef environment for visual purposes
        $scope.chef_preview = {
            description: 'Managed by cloudsu',
            json_class: 'Chef::Environment',
            chef_type: 'environment',
            default_attributes: {},
            override_attributes: {}
        };

        //get sample AMI images
        $http.get('/api/v1/ec2/sample/images')
            .success(function (response) {
                $scope.images = response;
            });

        //get ec2 sizes
        $http.get('/api/v1/ec2/sizes')
            .success(function (res) {
                $scope.instanceSizes = res.reverse();
            });

        //get ssl certificates
        $http.get('/api/v1/iam/ssl')
            .success(function (res) {
                $scope.ssls = res;
            });

        //get all ec2 ssh keys for account
        $http.get('/api/v1/ec2/keys')
            .success(function (res) {
                $scope.keys = res;
            });

        //get iam roles to assign to machines
        $http.get('/api/v1/iam/roles')
            .success(function (res) {
                $scope.roles = res;
            });

        //get az region map
        $http.get('/api/v1/region_map')
            .success(function (response) {
                $scope.regions = response;
            });

        //get account security groups
        $http.get('/api/v1/ec2/security_groups')
            .success(function (response) {
                $scope.security_groups = response;
            });


        $scope.createStack = function () {

            $scope.showSpinner = true;

            // check for alphas
            if (!$scope.stack.stack_name || $scope.stack.stack_name.match(/[^0-9a-z]/i)) {
                toastr.error('AWS only allows Alphanumeric characters for stack names', 'Error');
                $scope.showSpinner = false;
                return;
            }

            //convert recipe string to array
            if ($scope.stack.recipes_string) {
                $scope.stack.recipes = $scope.stack.recipes_string.replace(/ /g, '')
                    .split(',');
            } else {
                $scope.stack.recipes = [];
            }

            if ($scope.stack.build_size === 'HA') {
                //add all az's from region if true
                if ($scope.stack.multi_az) {
                    $scope.stack.regions = $scope.regions;
                } else {
                    $scope.stack.regions = [$scope.stack.region];
                }
            } else {
                $scope.stack.regions = $scope.stack.region;
            }


            //pluck just the sg id
            $scope.stack.elb_security_groups = _.pluck($scope.elb_sgs, 'GroupId');
            $scope.stack.security_groups = _.pluck($scope.sgs, 'GroupId');

            if (!$scope.stack.create_elb) {
                $scope.stack = _.omit($scope.stack, ['elb', 'elb_security_groups']);
            }

            var url = ['/api/v1/stacks', $scope.stack.stack_name].join('/');

            // create new stack
            $http.post(url, $scope.stack)
                .success(function (res) {
                    $scope.showSpinner = false;
                    $uibModalInstance.close(true);
                })
                .error(function (err) {
                    $scope.showSpinner = false;
                    toastr.error(err, 'Error');
                });

        };

        $scope.envChange = function () {
            // remove last name
            // causes a name for each letter typed
            if ($scope.last_name) {
                var new_defaults = _.omit($scope.chef_preview.default_attributes, [$scope.last_name]);
                $scope.chef_preview.default_attributes = new_defaults;
            }

            if ($scope.stack.stack_name) {
                $scope.chef_preview.name = $scope.stack.stack_name;
            }

            if ($scope.stack.app_name && $scope.stack.app_version) {
                $scope.chef_preview.default_attributes[$scope.stack.app_name] = {};
                $scope.chef_preview.default_attributes[$scope.stack.app_name].version = $scope.stack.app_version;
            }

            if ($scope.stack.domain) {
                $scope.chef_preview.default_attributes.domain = $scope.stack.domain;
            }

            $scope.last_name = _.clone($scope.stack.app_name);
        };

        $scope.setActiveTab = function (tab) {
            $scope.activeTab = tab;
        };

        $scope.isFirst = function () {
            return ($scope.activeTab === 'stack-tab');
        };

        $scope.isLast = function () {
            return ($scope.activeTab === 'scripts-tab');
        };

        //logic for step wizard
        $scope.activeNavTab = function (tab) {
            if ($scope.activeTab === tab) {
                return 'active';
            }
            return;
        };

        $scope.activeContentTab = function (tab) {
            if ($scope.activeTab === tab) {
                return 'tab-pane active';
            }
            return 'tab-pane';
        };


        // next decision matrix
        $scope.next = function (tab) {

            if ($scope.activeTab === 'stack-tab') {
                $scope.activeTab = 'storage-tab';
            } else if ($scope.activeTab === 'storage-tab') {
                if ($scope.stack.build_size === 'HA' && $scope.stack.create_elb) {
                    $scope.activeTab = 'elb-tab';
                } else {
                    $scope.activeTab = 'launch-config-tab';
                }
            } else if ($scope.activeTab === 'elb-tab') {
                $scope.activeTab = 'launch-config-tab';
            } else if ($scope.activeTab === 'launch-config-tab') {
                $scope.activeTab = 'scripts-tab';
            }

        };

        // previous decision matrix
        $scope.previous = function () {

            if ($scope.activeTab === 'storage-tab') {
                $scope.activeTab = 'stack-tab';
            } else if ($scope.activeTab === 'elb-tab') {
                $scope.activeTab = 'storage-tab';
            } else if ($scope.activeTab === 'launch-config-tab') {
                if ($scope.stack.build_size === 'HA' && $scope.stack.create_elb) {
                    $scope.activeTab = 'elb-tab';
                } else {
                    $scope.activeTab = 'storage-tab';
                }
            } else if ($scope.activeTab === 'scripts-tab') {
                $scope.activeTab = 'launch-config-tab';
            }
            return;
        };

        // close modal instance
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        // adds volume from the form
        $scope.addVolume = function () {
            $scope.stack.volumes.push({
                type: 'gp2',
                size: 30
            });
        };

        // removes a volume from the form
        $scope.removeVolume = function (index) {
            $scope.stack.volumes.splice(index, 1);
        };

        // adds security group from the form
        $scope.addSecurityGroup = function (group) {
            $scope.sgs.push(group);
        };

        // removes a security group from the form
        $scope.removeSecurityGroup = function (index) {
            $scope.sgs.splice(index, 1);
        };

        // adds elb security group from the form
        $scope.addElbSecurityGroup = function (group) {
            $scope.elb_sgs.push(group);
        };

        // removes an elb security group from the form
        $scope.removeElbSecurityGroup = function (index) {
            $scope.elb_sgs.splice(index, 1);
        };


    });
