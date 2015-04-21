'use strict';

/**
 * @ngdoc function
 * @name mgmApp.controller:NavCtrl
 * @description
 * # NavCtrl
 * Controller of the mgmApp
 */
angular.module('mgmApp').controller('NavCtrl', function ($scope, $location, mgmPublic, mgm) {

  $scope.loggedIn = false;
  $scope.$on("AuthChange", function (event, data) {
    $scope.loggedIn = data;
    if ($scope.loggedIn) {
      mgm.connect();
      mgm.pushLocation($location.url());
      $location.url("/loading");
    } else {
      $location.url("/");
    }
  });

  $scope.isActive = function (route) {
    return $location.path().indexOf(route) == 0;
  };

  $scope.logout = function () {
    mgm.disconnect();
    mgmPublic.logout();
  };
});
