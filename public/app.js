
var grep = angular.module('grep', ['base64']);

grep.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);


grep.controller('AppCtrl', ['$scope', '$location', '$base64', '$http', '$sce',
    function ($scope, $location, $base64, $http, $sce) {
  var config = $location.search(),
      authz = $base64.encode(config.apiToken + ':x-auth-token'),
      docApi = config.server + '/api/v1/document-sets/' + config.documentSetId + '/documents';
  $scope.query = {
    regex: null,
    running: false,
    message: null
  };
  $scope.regexUrl = null;

  $scope.run = function() {
    if (!$scope.canSearch()) return;
    $scope.query.running = true;
    $scope.query.message = null;
    $scope.regexUrl = [$sce.trustAsResourceUrl('http://jex.im/regulex/#!embed=true&flags=&re=' + encodeURIComponent($scope.query.regex))];

    var rex = new RegExp($scope.query.regex, 'i'),
        matches = [];

    oboe({
      url: docApi + '?stream=true&fields=id,text',
      headers: {
        'Authorization': 'Basic ' + authz
      }
    }).node('items.*', function(item) {
      if (rex.test(item.text)) {
        matches.push('id:' + item.id);
      }
      return oboe.drop;
    }).done(function() {
      $scope.query.running = false;
      if (matches.length == 0) {
        $scope.query.message = 'No results were found.';
      }
      $scope.$apply();

      window.parent.postMessage({
        call: 'setDocumentListParams',
        args: [{q: matches.join(' OR ')}]
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
