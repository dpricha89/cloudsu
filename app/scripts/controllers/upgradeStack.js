angular
    .module('stacks')
    .controller('upgradeStack', function($scope, $http, $uibModalInstance, dataStore, toastr, stack_name, build_size) {

        $scope.advanced = false;
        $scope.stack = {};
        $scope.stack.type = 'upgrade';
        $scope.stack.stack_name = stack_name;
        $scope.showSpinner = false;
        $scope.upgrade_options = true;
        $scope.build_size = build_size;


        $http.get('/api/v1/ec2/sizes')
            .success(function(response) {
                $scope.instanceSizes = response;
            });

        $http.get('/api/v1/chef/environments/' + stack_name)
            .success(function(response) {

                var defaults = response.default_attributes;
                if (defaults) {
                    var chef = defaults.cloudsu_params;
                    $scope.stack.min_size = chef.min_size;
                    $scope.stack.desired_size = chef.desired_size;
                    $scope.stack.max_size = chef.max_size;
                    $scope.current_version = chef.app_version;
                    $scope.stack.ami = chef.ami;
                    $scope.stack.instance_size = chef.instance_size;
                    $scope.stack.app_name = chef.app_name;
                }

            });

        $scope.upgrade = function() {

            //show spinner
            $scope.showSpinner = true;

            $http.patch('/api/v1/upgrade', $scope.stack)
                .success(function(data) {
                    $scope.showSpinner = false;
                    $uibModalInstance.close(true);
                })
                .error(function(err) {
                    $scope.showSpinner = false;
                    toastr.error(err, 'Error');
                });
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };

    });
