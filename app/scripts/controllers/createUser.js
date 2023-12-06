angular
    .module('stacks')
    .controller('createUser', function($scope, $http, $state, $uibModalInstance, dataStore, _, toastr) {

        // setup defaults
        $scope.token = false;
        $scope.user = {};
        $scope.user.type = 'USER';
        $scope.user.email_pass = false;
        $scope.showSpinner = false;

        $scope.create = function() {

            //ensure password match
            if ($scope.user.password !== $scope.user.confirm &&
                $scope.user.user_type === 'User' &&
                !$scope.user.email_pass) {
                return toastr.error('Passwords do not match', 'Error');
                // ensure password is at least 8 characters
            } else if ($scope.user.user_type === 'Service' || ($scope.user.email_pass && $scope.user.user_type === 'User')) {
                //stub so password length is not hit when it is not used
            } else if ($scope.user.password.length < 8 &&
                $scope.user.user_type === 'User' &&
                !$scope.user.email_pass) {
                return toastr.error('Passwords must be at least 8 characters', 'Error');
            }

            //start spinner
            $scope.showSpinner = true;

            // send create request
            $http.post('/api/v1/accounts', $scope.user)
                .success(function(response) {
                    $scope.showSpinner = false;
                    if (response.service_token) {
                        $scope.token = response.service_token;
                    } else {
                        $uibModalInstance.close('success');
                    }
                })
                .error(function(err) {
                    $scope.showSpinner = false;
                    toastr.error(err, 'Error');
                });
        };

        $scope.cancel = function() {
            $uibModalInstance.close('success');
        };

    });
