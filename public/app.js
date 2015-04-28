
var grep = angular.module('grep', ['base64']);

grep.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true);
}]);


grep.controller('AppCtrl', ['$scope', '$location', '$base64', '$http',
    function ($scope, $location, $base64, $http) {
  var config = $location.search(),
      authz = $base64.encode(config.apiToken + ':x-auth-token'),
      docApi = config.server + '/api/v1/document-sets/' + config.documentSetId + '/documents';
  //console.log(config);
  $http.defaults.headers.common['Authorization'] = 'Basic ' + authz;
  $scope.query = {'regex': null};

  $scope.run = function() {
    if (!$scope.validRegex()) return;

    var rex = new RegExp($scope.query.regex, 'i')

    oboe({
      url: docApi + '?stream=true&fields=id,text',
      withCredentials: false,
      headers: {
        'Authorization': 'Basic ' + authz
      }
    }).node('items.*', function(item) {
      if (rex.test(item.text)) {
        //console.log(item);
      }
      console.log(item);
    })

  };

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
