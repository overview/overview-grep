
var grep = angular.module('grep', []);

grep.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);


grep.controller('AppCtrl', ['$scope', '$location', '$http', '$sce', '$timeout',
    function ($scope, $location, $http, $sce, $timeout) {
  var config = $location.search();
  $scope.query = {regex: null, caseInsensitive: false, running: false};
  $scope.status = {message: null, type: null};

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

    // If the query's still running after 500ms,
    // reassure the user that something's happening.
    $timeout(function() {
      if ($scope.query.running) {
        $scope.status.type = 'alert-warning';
        $scope.status.message = $sce.trustAsHtml(
          "Search Results Loading&hellip;<br/><i>(This can take a while on large document sets.)</i>"
        );
      }
    }, 600);

    var params = angular.copy(config);
    params['regex'] = $scope.query.regex;

    $http.get('/parse', {params: params}).then(function(res) {
      $scope.query.running = false;
      if (res.data.data.errors) {
        $scope.status.type = 'alert-danger';
        $scope.status.message = $sce.trustAsHtml('An unknown error occured.');
      }
      else {
        $scope.status.type = null;
        $scope.status.message = null;
        window.parent.postMessage({
          call: 'setDocumentListParams',
          args: [{objects: {
            ids: [res.data.data.attributes.resultsId],
            title: '%s matching regex ' + $scope.query.regex
          }}]
        }, config.server);
      }
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
