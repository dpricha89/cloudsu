angular
    .module('stacks')
    .controller('resetPassword', function($scope, $http, $state, $uibModalInstance, toastr) {

        $scope.showSpinner = false;


        $scope.save = function() {
            if ($scope.user.password !== $scope.user.confirm) {
                return toastr.error('Passwords do not match', 'Error');
            } else if ($scope.user.password < 8) {
                return toastr.error('Passwords must be at least 8 characters', 'Error');
            }

            //start show spinner
            $scope.showSpinner = true;

            $http.put('/api/v1/accounts/reset', $scope.user)
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
