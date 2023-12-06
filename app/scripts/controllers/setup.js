angular
    .module('stacks')
    .controller('setup', function($scope, $http, $state, $interval, $uibModalInstance, dataStore, toastr, SweetAlert) {

        $scope.showSpinner = false;
        $scope.activeTab = 'aws-tab';
        $scope.bar_value = 0;

        $http.get('/api/v1/regions')
            .success(function(regions) {
                $scope.regions = regions;
            })
            .error(function(err) {
                toastr.error(err, 'Error');
            });

        // created outside function so it can be removed
        var intervalPromise;

        function refresher() {
            // refresh every 3 seconds
            intervalPromise = $interval(function() {
                $http.get('/api/v1/ping/' + dataStore.getToken())
                    .success(function(res) {
                        if (res.setup) {
                            $scope.bar_value = 100;
                            setTimeout(function() {
                                $uibModalInstance.close(true);
                            }, 2000);
                        } else if ($scope.bar_value < 89) {
                            var randomNum = Math.floor(Math.random() * 10) + 5;
                            $scope.bar_value = $scope.bar_value + randomNum;
                        }

                    });
            }, 5000);
        }

        $scope.create = function() {
            $scope.account.aws.type = 'AWS';
            $scope.account.aws.name = 'DEFAULT';
            $scope.account.cms.type = 'CMS';
            $scope.account.cms.name = 'DEFAULT';
            $scope.account.cms.server = 'CHEF';
            $scope.account.user.type = 'USER';

            if ($scope.account.user.password !== $scope.account.user.confirm) {
                return toastr.error('Passwords do not match', 'Error');
            }

            $scope.showSpinner = true;
            $http.post('/api/v1/setup/' + $scope.account.aws.name, $scope.account)
                .success(function(response) {
                    $scope.showSpinner = false;
                    $scope.bar_value = $scope.bar_value + 10;
                    refresher();
                })
                .error(function(err) {
                    $scope.showSpinner = false;
                    toastr.error(err, 'Error');
                });
        };

        $scope.setActiveTab = function(tab) {
            $scope.activeTab = tab;
        };

        $scope.isFirst = function() {
            return ($scope.activeTab === 'aws-tab');
        };

        $scope.isLast = function() {
            return ($scope.activeTab === 'user-tab');
        };

        //logic for step wizard
        $scope.activeNavTab = function(tab) {
            if ($scope.activeTab === tab) {
                return 'active';
            }
        };

        $scope.activeContentTab = function(tab) {
            if ($scope.activeTab === tab) {
                return 'tab-pane active';
            }
            return 'tab-pane';
        };


        // next decision matrix
        $scope.next = function(tab) {

            if ($scope.activeTab === 'aws-tab') {
                $scope.activeTab = 'chef-tab';
            } else if ($scope.activeTab === 'chef-tab') {
                $scope.activeTab = 'user-tab';
            }

        };

        // previous decision matrix
        $scope.previous = function() {

            if ($scope.activeTab === 'chef-tab') {
                $scope.activeTab = 'aws-tab';
            } else if ($scope.activeTab === 'user-tab') {
                $scope.activeTab = 'chef-tab';
            }

        };

        //stop refresher when the screen is changed
        $scope.$on('$destroy', function() {
            $interval.cancel(intervalPromise);
        });

        // close modal instance
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };



    });
