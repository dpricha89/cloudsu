angular
    .module('stacks')
    .controller('stackLogs', function ($scope, $http, $uibModalInstance, stack_logs, stack_name) {

        $scope.stack_logs = stack_logs;

        $scope.logColor = function (status) {
            if (status.includes('FAILED')) {
                return 'danger';
            }
        };


    });
