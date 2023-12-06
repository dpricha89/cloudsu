function config($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/login');

    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'loginController'
        })
        .state('index', {
            abstract: true,
            url: '/index',
            templateUrl: 'views/common/content.html',
        })
        .state('index.detail', {
            url: '/stacks/:stack_name',
            templateUrl: 'views/stack.html',
            controller: 'stackController'
        })
        .state('index.stacks', {
            url: '/stacks',
            templateUrl: 'views/stacks.html',
            controller: 'stacksController'
        })
        .state('index.users', {
            url: '/users',
            templateUrl: 'views/users.html',
            controller: 'usersController'
        })
        .state('index.system', {
            url: '/system',
            templateUrl: 'views/system.html',
            controller: 'system'
        });
}
angular
    .module('stacks')
    .config(config)
    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });
