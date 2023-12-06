/**
 * MainCtrl - controller
 */
angular
    .module('stacks')
    .controller('MainCtrl', function($scope, $http, $state, $uibModal, dataStore, SweetAlert) {

        $scope.userName = dataStore.getActiveUser();
        $scope.activeAws = dataStore.getActiveAWS();
        $scope.activeRegion = dataStore.getActiveRegion();
        $scope.isLogin = dataStore.getIsLogin();

        //send refesh to child controller
        function childRefresh() {
            $scope.$broadcast('refresh');
        }

        //get available regions
        function refresh() {
            $http.get('/api/v1/regions')
                .success(function(regions) {
                    $scope.aws_regions = regions;
                });

            //get available aws accounts
            $http.get('/api/v1/services/list')
                .success(function(accounts) {
                    $scope.aws_accounts = accounts;
                });
        }

        //logout method
        $scope.logout = function() {
            dataStore.clearAll();
            $state.go('login');
        };

        //Get bear api token
        $scope.getToken = function() {
            $http.get('/api/v1/accounts/token')
                .success(function(token) {
                    SweetAlert.swal({
                        title: 'Service API Token',
                        text: '<pre><code>' + token + '</code></pre>',
                        html: true,
                        type: 'success',
                        confirmButtonColor: '#1ab394'
                    });
                })
                .error(function(err) {

                });

        };

        $scope.resetPassword = function() {
            //open reset password modal
            $uibModal.open({
                animation: true,
                templateUrl: 'views/modals/resetPassword.html',
                controller: 'resetPassword',
                size: 'md'
            });
        };

        $scope.activateRegion = function(region) {
            //save active account in local storage
            dataStore.setActiveRegion(region);
            $scope.activeRegion = region;
            //refresh child screen to reflect changes
            childRefresh();
            //update db so changes will be reflected in next login
            $http.put('/api/v1/accounts', {
                aws_region: region
            });

        };

        $scope.activateAccount = function(account) {
            //save active account in local storage
            dataStore.setActiveAWS(account);
            $scope.activeAws = account;
            //refresh child screen to reflect changes
            childRefresh();
            //update db so changes will be reflected in next login
            $http.put('/api/v1/accounts', {
                aws_account: account
            });
        };

        $scope.startup = function() {
            $scope.isLogin = true;
            refresh();
        };

        if ($scope.isLogin) {
            refresh();
        }

    });
