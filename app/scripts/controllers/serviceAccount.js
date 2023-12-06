angular
    .module('stacks')
    .controller('serviceAccount', function($scope, $http, $uibModalInstance, dataStore, _, account, type, toastr) {

        $scope.account = account || {};
        $scope.account.type = type;
        $scope.showSpinner = false;

        $scope.saveServiceAccount = function() {

            //show show spinner
            $scope.showSpinner = true;

            //save account in database
            $http.post('/api/v1/services/save_account', $scope.account)
                .success(function(res) {
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
