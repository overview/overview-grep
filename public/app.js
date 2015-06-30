
var grep = angular.module('grep', []);

grep.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);


grep.controller('AppCtrl', ['$scope', '$location', '$http', '$sce',
    function ($scope, $location, $http, $sce) {
  var config = $location.search();
  $scope.query = {regex: null, running: false, message: null};

  $scope.run = function() {
    if (!$scope.canSearch()) return;

    // Allow user to enter an empty search to reset doc list
    if($scope.query.regex.trim().length == 0) {
      window.parent.postMessage({
        call: 'setDocumentListParams',
        args: [{}]
      }, config.server);
      return;
    }

    $scope.query.running = true;
    $scope.query.message = null;

    var params = angular.copy(config);
    params['regex'] = $scope.query.regex;

    $http.get('/parse', {params: params}).then(function(res) {
      $scope.query.running = false;
      if (res.data.data.errors) {
        $scope.query.message = 'An unknown error occured.';
      }

      window.parent.postMessage({
        call: 'setDocumentListParams',
        args: [{objects: [res.data.data.attributes.resultsId], title: '%s matching regex ' + $scope.query.regex}]
      }, config.server);
    });
  };

  $scope.canSearch = function() {
    return $scope.validSearch() && !$scope.query.running;
  }

  $scope.validSearch = function() {
    var rex = $scope.query.regex;
    try {
      new RegExp(rex);
      return true;
    } catch (e) {
      return false;
    }
  };

}]);
