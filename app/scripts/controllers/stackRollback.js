angular
    .module('stacks')
    .controller('stackRollback', function($scope, $http, $uibModalInstance, stack_name, dataStore, toastr) {

        $scope.stack_name = stack_name;
        $scope.showSpinner = false;


        $http.get('/api/v1/chef/rollback_check/' + $scope.stack_name)
            .success(function(response) {
                $scope.rollback_available = response;
            })
            .error(function(err) {
                toastr.error(err, 'Error');
            });

        $scope.rollback = function() {
            $scope.showSpinner = true;
            $http.patch('/api/v1/upgrade/rollback', {
                    stack_name: $scope.stack_name
                })
                .success(function(response) {
                    $scope.showSpinner = false;
                    $uibModalInstance.dismiss('cancel');
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
