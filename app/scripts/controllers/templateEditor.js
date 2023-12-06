// model editor view
angular
    .module('stacks')
    .controller('templateEditor', function($scope, $http, $uibModalInstance, template, stack_name, dataStore, toastr) {

        $scope.name = stack_name;
        $scope.showSpinner = false;

        $scope.myInitCallback = function(editor) {
            var o = JSON.parse(template);
            $scope.editorData = JSON.stringify(o, null, 4);
            editor.$blockScrolling = Infinity;
            editor.session.setMode('ace/mode/json');
            editor.setOption('showPrintMargin', false);
            editor.getSession()
                .setTabSize(4);
        };

        $scope.onDeploy = function() {

            //start spinner
            $scope.showSpinner = true;

            $http.put('/api/v1/stacks/' + stack_name, {
                    'template': $scope.editorData,
                    'stack_name': stack_name
                })
                .success(function(data) {
                    $scope.showSpinner = false;
                    $uibModalInstance.close();
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
