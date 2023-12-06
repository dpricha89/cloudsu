angular
    .module('stacks')
    .controller('groupResize', function($scope, $http, $uibModalInstance, stack_name, app_name, version, dataStore, toastr) {

        $scope.showSpinner = false;

        var params = {
            stack_name: stack_name,
            app_name: app_name,
            version: version
        };

        $scope.adjustSize = function() {
            $scope.showSpinner = true;
            params = _.extend(params, $scope.adjust);
            $http.patch('/api/v1/adjust_size', params)
                .success(function(response) {
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
