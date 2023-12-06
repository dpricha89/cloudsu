angular
    .module('stacks')
    .controller('import', function($scope, $http, $uibModalInstance, toastr) {

        $scope.showSpinner = false;


        $scope.importConfig = function() {
            $scope.showSpinner = true;
            if (!$scope.config) {
                $scope.showSpinner = true;
                return;
            }
            $http.post('/api/v1/system/import', $scope.config)
                .success(function(response) {
                    $scope.showSpinner = true;
                    $uibModalInstance.close(true);
                })
                .error(function(err) {
                    $scope.showSpinner = true;
                    toastr.error(err, 'Error');
                });
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };


    });
