angular
    .module('stacks')
    .controller('connectElb', function($scope, $http, $uibModalInstance, elbs, scale_group, dataStore, toastr) {

        $scope.elbs = elbs;
        $scope.showSpinner = false;


        $scope.connect = function() {
            $scope.showSpinner = true;
            $http.patch('/api/v1/elb/connect', {
                    scale_group: scale_group,
                    elb: $scope.elb_name
                })
                .success(function(data) {
                    $scope.showSpinner = false;
                    $uibModalInstance.close(true);
                })
                .error(function(err) {
                    $scope.showSpinner = false;
                    toastr.error(err, 'AWS Error');
                });
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };

    });
