angular
    .module('stacks')
    .controller('stacksController', function($rootScope, $interval, $scope, $http, $state, $uibModal, SweetAlert, dataStore, toastr) {

        //Get stacks from AWS
        function refresh() {
            $http.get('/api/v1/stacks')
                .success(function(response) {
                    $scope.stacks = response;
                })
                .error(function(err) {
                    toastr.error(err, 'AWS Error');
                });
        }

        //catch alerts from parent to refresh
        $scope.$on('refresh', function() {
            refresh();
        });

        $scope.openCreateForm = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/createStack.html',
                controller: 'createStack',
                size: 'md'
            });

            modalInstance.result.then(function(selectedItem) {
                //refresh service accounts
                refresh();
            });
        };

        //Open stack detail view
        $scope.openStack = function(stack_name) {
            dataStore.setStack(stack_name);
            $state.go('index.detail', {
                stack_name: stack_name
            });
        };

        //Delete stack but confirm first
        $scope.deleteStack = function($event, stack_name) {
            $event.stopImmediatePropagation();

            SweetAlert.swal({
                    title: 'Are you sure?',
                    text: 'All stack resources will be removed: ' + stack_name,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#1ab394',
                    confirmButtonText: 'Yes, delete it!',
                    closeOnConfirm: false
                },
                function(isConfirm) {
                    if (isConfirm) {
                        $http.delete('/api/v1/stacks/' + stack_name)
                            .success(function(res) {
                                SweetAlert.swal('Success', stack_name + ' is being deprovisioned.', 'success');
                                refresh();
                            })
                            .error(function(err) {
                                toastr.error(err, 'AWS Error');
                            });
                    }
                });
        };


        $scope.panelColor = function(status) {
            switch (true) {
                case status.includes('DELETE_IN_PROGRESS'):
                    return 'panel panel-danger';
                case status.includes('ROLLBACK'):
                    return 'panel panel-warning';
                case status.includes('PROGRESS'):
                    return 'panel panel-info';
                case status.includes('FAILED'):
                    return 'panel panel-danger';
                default:
                    return 'panel panel-primary';
            }
        };

        $scope.stackStatus = function(status) {
            switch (true) {
                case status.includes('DELETE_IN_PROGRESS'):
                    return 'fa fa-cloud';
                case status.includes('ROLLBACK'):
                    return 'fa fa-cloud';
                case status.includes('PROGRESS'):
                    return 'fa fa-ship';
                case status.includes('FAILED'):
                    return 'fa fa-cloud';
                default:
                    return 'fa fa-sun-o';
            }
        };

        $scope.isUpdating = function(status) {
            if (status.includes('PROGRESS')) {
                return true;
            } else {
                return false;
            }
        };

        // created outside function so it can be removed
        var intervalPromise;

        function refresher() {
            // refresh every 15 seconds
            intervalPromise = $interval(function() {
                refresh();
            }, 15000);
        }

        //stop refresher when the screen is changed
        $scope.$on('$destroy', function() {
            $interval.cancel(intervalPromise);
        });

        //get initial data
        refresh();
        //start refresher
        refresher();

    });
