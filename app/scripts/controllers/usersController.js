angular
    .module('stacks')
    .controller('usersController', function($scope, $http, $state, $uibModal, SweetAlert, dataStore, toastr) {

        //to make the ui render correctly
        $scope.admin = true;

        function refresh() {
            $http.get('api/v1/accounts/')
                .success(function(users) {
                    $scope.users = users;
                    $scope.admin = true;
                })
                .error(function(err) {
                    $scope.admin = false;
                });
        }

        $scope.createUser = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/createUser.html',
                controller: 'createUser',
                size: 'md',
                resolve: {}
            });

            modalInstance.result.then(function() {
                //refresh user to show new
                refresh();
            });
        };

        $scope.editUser = function(user) {
            SweetAlert.swal({
                    title: '',
                    text: 'Switch ' + user.name + ' admin status?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#1ab394',
                    confirmButtonText: 'Yes',
                    closeOnConfirm: false
                },
                function(isConfirm) {
                    if (isConfirm) {
                        user.admin = !user.admin;
                        $http.put('/api/v1/accounts/', user)
                            .success(function(response) {
                                refresh();
                                SweetAlert.swal('Success', user.name + ' admin status has been changed to: ' + user.admin, 'success');
                            })
                            .error(function(err) {
                                toastr.error(err, 'Error');
                            });
                    }
                });
        };


        $scope.removeUser = function(user) {
            SweetAlert.swal({
                    title: 'Are you sure?',
                    text: 'User will be removed from the database: ' + user.name,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#1ab394',
                    confirmButtonText: 'Yes, delete user!',
                    closeOnConfirm: false
                },
                function(isConfirm) {
                    if (isConfirm) {
                        $http.delete('/api/v1/accounts/' + user.name)
                            .success(function(res) {
                                SweetAlert.swal('Success', user.name + ' has been removed.', 'success');
                                refresh();
                            })
                            .error(function(err) {
                                toastr.error(err, 'AWS Error');
                            });
                    }
                });
        };

        //load initial
        refresh();

    });
