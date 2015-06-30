
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
    return $scope.validRegex() && !$scope.query.running;
  }

  $scope.validRegex = function() {
    var rex = $scope.query.regex;
    if (!rex || rex.trim().length == 0) {
      return false;
    }
    try {
      new RegExp(rex);
      return true;
    } catch (e) {
      return false;
    }
  };

}]);
