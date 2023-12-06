angular
    .module('stacks')
    .controller('stackController', function ($scope, $q, $interval, $stateParams, $http, $uibModal, SweetAlert, dataStore, _, toastr) {

        $scope.stack_name = $stateParams.stack_name;

        if (!$scope.stack_name) {
            return;
        }

        //merge more data into the ec2 objects
        function mergeEc2Objects(group1, group2) {
            return _.each(group1, function (y) {
                var obj = _.find(group2, function (x) {
                    return (x.InstanceId === y.InstanceId);
                });
                y.PrivateIpAddress = obj.PrivateIpAddress;
                y.PublicIpAddress = obj.PublicIpAddress;
                y.KeyName = obj.KeyName;
                y.InstanceType = obj.InstanceType;
                y.LaunchTime = obj.LaunchTime;
                y.ImageId = obj.ImageId;
                return y;
            });
        }

        //get ec2 specific for autoscale groups
        function updateEc2() {
            _.each($scope.scaleGroups, function (group, index) {
                if (group.Instances.length < 1) {
                    return group;
                }
                var instances = _.pluck(group.Instances, 'InstanceId');
                $http.get('/api/v1/ec2/' + instances)
                    .success(function (data) {
                        $scope.scaleGroups[index].Instances = mergeEc2Objects(group.Instances, data);
                    })
                    .error(function (err) {
                        toastr.error(err, 'AWS Error');
                    });
            });
        }

        //get ec2 specific data for single
        function getEc2(instances) {
            var instance_ids = _.pluck(instances, 'PhysicalResourceId');
            $http.get('/api/v1/ec2/' + instance_ids)
                .success(function (data) {
                    $scope.instances = data;
                })
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });

        }

        //get data from tags
        function addTags() {
            _.each($scope.scaleGroups, function (group, index) {
                $scope.scaleGroups[index].version = _.find(group.Tags, function (tag) {
                        return tag.Key === 'version';
                    })
                    .Value;
                $scope.scaleGroups[index].app_name = _.find(group.Tags, function (tag) {
                        return tag.Key === 'app_name';
                    })
                    .Value;
            });
        }

        //add more elb specific data
        function updateElb() {
            _.each($scope.scaleGroups, function (group, index) {
                if (group.LoadBalancerNames.length < 1) {
                    return group;
                }
                $http.get('/api/v1/elb/' + group.LoadBalancerNames)
                    .success(function (data) {
                        $scope.scaleGroups[index].LoadBalancerNames = data.LoadBalancerDescriptions;
                    })
                    .error(function (err) {
                        toastr.error(err, 'AWS Error');
                    });
            });
        }

        //setup functions
        function updateScaleGroups(scaleGroups) {
            var groups = _.pluck(scaleGroups, 'PhysicalResourceId');
            $http.get('/api/v1/asg/describe/' + groups)
                .success(function (response) {
                    $scope.scaleGroups = response.AutoScalingGroups;
                    updateEc2();
                    updateElb();
                    addTags();
                })
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });
        }

        function refresh() {
            $http.get('/api/v1/stacks/status/' + $scope.stack_name)
                .success(function (response) {
                    $scope.stack_status = response;
                })
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });


            $http.get('/api/v1/stacks/' + $scope.stack_name)
                .success(function (data) {
                    $scope.resources = data.StackResources;
                    var instances = _.filter(data.StackResources, function (x) {
                        return x.ResourceType === 'AWS::EC2::Instance';
                    });
                    var scaleGroups = _.filter(data.StackResources, function (x) {
                        return x.ResourceType === 'AWS::AutoScaling::AutoScalingGroup';
                    });

                    if (scaleGroups.length > 0) {
                        updateScaleGroups(scaleGroups);
                    } else if (instances.length > 0) {
                        getEc2(instances);
                    }
                })
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });

            $http.get('/api/v1/stacks/describeEvents/' + $scope.stack_name)
                .success(function (response) {
                    $scope.stack_logs = response;
                })
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });

            $http.get('/api/v1/chef/environments/' + $scope.stack_name)
                .success(function (response) {
                    var defaults = response.default_attributes;
                    if (defaults) {
                        $scope.chef_status = defaults.status;
                        $scope.rollback_available = defaults.rollback_available;
                        $scope.chef = defaults.cloudsu_params;
                    }
                })
                .error(function (err) {
                    toastr.error(err, 'Chef Error');
                });

        }

        //adjust the size of autoscale group
        $scope.adjustSize = function (app_name, version) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/groupResize.html',
                controller: 'groupResize',
                size: 'md',
                resolve: {
                    stack_name: function () {
                        return $scope.stack_name;
                    },
                    app_name: function () {
                        return app_name;
                    },
                    version: function () {
                        return version;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                //refresh service accounts
                refresh();
            });
        };

        $scope.detachElb = function (scale_group, elb_name) {
            console.log(scale_group, elb_name);
            SweetAlert.swal({
                    title: '',
                    text: 'Are you sure you want to detach this ELB?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#1ab394',
                    confirmButtonText: 'Yes',
                    closeOnConfirm: false
                },
                function (isConfirm) {
                    if (isConfirm) {
                        $http.patch('/api/v1/elb/disconnect', {
                                scale_group: scale_group,
                                elb: elb_name
                            })
                            .success(function (response) {
                                refresh();
                                SweetAlert.swal('Success', elb_name + ' has been detached from scale group ' + scale_group, 'success');
                            })
                            .error(function (err) {
                                toastr.error(err, 'AWS Error');
                            });
                    }
                });
        };


        //remove one autoscale group
        $scope.removeAsg = function (app_name, version) {
            var params = {
                app_name: app_name,
                version: version,
                stack_name: $scope.stack_name
            };
            $http.patch('/api/v1/delete_asg', params)
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });
        };

        $scope.availableElbs = function (scale_group) {
            //get available ELBs
            $http.get('/api/v1/available_elbs/' + $scope.stack_name)
                .success(function (response) {
                    //open modal and give user a chance to connect ELB
                    var modalInstance = $uibModal.open({
                            animation: true,
                            templateUrl: 'views/modals/connectElb.html',
                            controller: 'connectElb',
                            size: 'md',
                            resolve: {
                                elbs: function () {
                                    return response;
                                },
                                scale_group: function () {
                                    return scale_group;
                                }
                            }
                        })
                        .error(function (err) {
                            toastr.error(err, 'AWS Error');
                        });

                    modalInstance.result.then(function (selectedItem) {
                        //refresh service accounts
                        refresh();
                    });
                });
        };

        //open upgrade form
        $scope.openUpgradeForm = function () {
            $scope.stack_name = dataStore.getStack();
            $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/upgradeStack.html',
                controller: 'upgradeStack',
                size: 'md',
                resolve: {
                    stack_name: function () {
                        return $scope.stack_name;
                    },
                    build_size: function () {
                        return $scope.chef.build_size;
                    }
                }
            });
        };

        //open rollback modal
        $scope.rollback = function () {
            $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/stackRollback.html',
                controller: 'stackRollback',
                size: 'md',
                resolve: {
                    stack_name: function () {
                        return $scope.stack_name;
                    }
                }
            });
        };

        $scope.openStackLogs = function () {
            $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/stackLogs.html',
                controller: 'stackLogs',
                size: 'md',
                resolve: {
                    stack_logs: function () {
                        return $scope.stack_logs;
                    },
                    stack_name: function () {
                        return $scope.stack_name;
                    }
                }
            });
        };

        //open check editor
        $scope.openEnvEditor = function () {

            $http.get('/api/v1/chef/environments/' + $scope.stack_name)
                .success(function (response) {
                    $uibModal.open({
                        animation: true,
                        templateUrl: 'views/modals/editor.html',
                        controller: 'chefEditor',
                        size: 'lg',
                        resolve: {
                            environment: function () {
                                return response;
                            },
                            stack_name: function () {
                                return $scope.stack_name;
                            }
                        }
                    });
                })
                .error(function (err) {
                    toastr.error(err, 'Chef Error');
                });
        };

        //open
        $scope.openStackEditor = function () {

            $http.get('/api/v1/stacks/template/' + $scope.stack_name)
                .success(function (response) {
                    $scope.template = response;
                    $uibModal.open({
                        animation: true,
                        templateUrl: 'views/modals/editor.html',
                        controller: 'templateEditor',
                        size: 'lg',
                        resolve: {
                            template: function () {
                                return $scope.template;
                            },
                            stack_name: function () {
                                return $scope.stack_name;
                            }
                        }
                    });
                })
                .error(function (err) {
                    toastr.error(err, 'AWS Error');
                });
        };

        $scope.status_label = function (status) {
            if (status !== 'READY') {
                return 'badge badge-warning';
            } else {
                return 'badge badge-primary';
            }
        };

        $scope.status_fa_label = function (status) {
            if (status !== 'READY') {
                return 'fa fa-circle-o-notch fa-spin';
            } else {
                return 'fa fa-check-circle';
            }
        };

        $scope.stack_status_label = function (status) {
            if (status === 'UPDATE_COMPLETE' || status === 'CREATE_COMPLETE') {
                return 'badge badge-primary';
            }
            return 'badge badge-warning';
        };

        $scope.stack_status_fa_label = function (status) {

            if (status && status.includes('PROGRESS')) {
                return 'fa fa-circle-o-notch fa-spin';
            }
            return 'fa fa-check-circle';

        };

        $scope.isHappy = function (status) {
            if (status === 'Healthy') {
                return 'fa fa-smile-o';
            }
            return 'fa fa-frown-o';
        };

        $scope.inService = function (status) {
            if (status === 'InService') {
                return 'fa  fa-thumbs-up';
            }
            return 'fa fa-circle-o-notch fa-spin';

        };

        $scope.logColor = function (status) {
            if (status.includes('FAILED')) {
                return 'danger';
            }
        };

        $scope.rowColor = function (health, state) {
            if (health === 'Healthy' && state === 'InService') {
                return;
            } else if (health === 'Unhealthy') {
                return 'danger';
            } else {
                return 'warning';
            }
        };

        var intervalPromise;

        function refresher() {
            // refresh every 10 seconds
            intervalPromise = $interval(function () {
                refresh();
            }, 15000);
        }

        //stop refresher when the screen is changed
        $scope.$on('$destroy', function () {
            $interval.cancel(intervalPromise);
        });

        //get initial data
        refresh();
        //start refresher
        refresher();

    });
