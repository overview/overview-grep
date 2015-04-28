
var grep = angular.module('grep', []);

grep.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);


grep.controller('AppCtrl', ['$scope', '$location', function ($scope, $location) {
  $scope.config = $location.search();

}]);
