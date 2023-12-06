angular
    .module('stacks')
    .factory('httpRequestInterceptor', function(dataStore) {
        return {
            request: function(config) {
                config.headers.aws_account = dataStore.getActiveAWS() || 'DEFAULT';
                config.headers.aws_region = dataStore.getActiveRegion() || 'us-east-1';
                config.headers.token = dataStore.getToken() || '';
                return config;
            }
        };
    });

angular
    .module('stacks')
    .factory('httpResponseInterceptor', function($location, $q) {
        return {
            responseError: function(err) {

                if (err.status === 401) {
                    $location.path('/login');
                    return $q.reject(err);
                }
                return $q.reject(err);
            }
        };
    });

angular
    .module('stacks')
    .config(function($httpProvider) {
        $httpProvider.interceptors.push('httpResponseInterceptor');
        $httpProvider.interceptors.push('httpRequestInterceptor');
    });
