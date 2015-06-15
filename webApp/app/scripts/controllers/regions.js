'use strict';

/**
 * @ngdoc function
 * @name mgmApp.controller:RegionsCtrl
 * @description
 * # RegionsCtrl
 * Controller of the mgmApp
 */
angular.module('mgmApp')
  .controller('RegionsCtrl', function($scope, $location, $timeout, $modal, mgm) {

    if ($scope.auth === undefined || $scope.auth === {}) {
      mgm.pushLocation($location.url());
      $location.url('/loading');
    }

    var dummyEntry = ' <show all estates>';

    var regions = {};
    $scope.estates = {};
    $scope.estates[dummyEntry] = {};
    $scope.search = {
      estateName: dummyEntry,
      regionName: '',
    };

    $scope.region = {
      start: function(region) {
        console.log('Requesting start region: ' + region.Name);
        mgm.request('StartRegion', {
          RegionUUID: region.UUID
        }, function(success, msg) {
          if (success) {
            alertify.success(msg);
          } else {
            alertify.error(msg);
          }
        });
      },
      kill: function(region) {
        mgm.request('KillRegion', {
          RegionUUID: region.UUID
        }, function(success, msg) {
          if (success) {
            alertify.success(msg);
          } else {
            alertify.error(msg);
          }
        });
      },
      content: function(region) {
        alertify.error('content not implemented js: ' + region.Name);
      },
      manage: function(region) {
        if (region.Running) {
          mgm.request('OpenConsole', {
            RegionUUID: region.UUID
          }, function(success, msg) {
            if (success) {
              alertify.success(msg);
            } else {
              alertify.error(msg);
            }
          });
        } else {
          //prime region with estate object so forms play nicer
          var estates = mgm.estates;
          for(var id in estates){
            if(estates[id].Name === region.EstateName){
              region.estate = estates[id];
            }
          }
          var hosts = mgm.hosts;
          hosts[0] = {ID: 0, Hostname: '<none>'}
          for(var id in hosts){
            if(hosts[id].ID === region.Host){
              region.host = hosts[id];
            }
          }
          var modInst = $modal.open({
            animation: true,
            templateUrl: 'manageSettingsModal.html',
            backdrop: 'static',
            keyboard: false,
            controller: 'ManageRegionSettingsCtrl',
            resolve: {
              region: function() {
                return region;
              },
              estates: function() {
                return estates;
              },
              hosts: function() {
                return hosts;
              }
            }
          });
          modInst.result.then(function() {
            console.log("modal closed");
            delete region.estate;
            delete region.host;
          });
        }
      },
      log: function(region) {
        alertify.error('log not implemented js: ' + region.Name);
      },
      showAdd: function() {
        alertify.error('Add region not implemented js');
      }
    };

    $scope.shouldShow = function(name) {
      if (name === dummyEntry) {
        return false;
      }
      if ($scope.search.estateName === dummyEntry) {
        //listing all estates
        //iterate over estates, do not list estates where all regions are filtered out
        for (var uuid in $scope.estates[name]) {
          if ($scope.estates[name][uuid].Name.includes($scope.search.regionName)) {
            return true;
          }
        }
        return false;
      }
      return $scope.search.estateName === name;
    };

    $scope.humanReadableUptime = function(ns) {
      var seconds = ns / 1000000000;
      var days = Math.floor(seconds / 86400);
      seconds = seconds % (86400);
      var hours = Math.floor(seconds / 3600);
      seconds = seconds % (3600);
      var minutes = Math.floor(seconds / 60);
      return days + 'd ' + hours + 'h ' + minutes + 'm';
    };

    function estateifyRegion(event, region) {
      if (region.UUID in regions) {
        regions[region.UUID] = region;
      } else {
        if (region.EstateName in $scope.estates) {
          regions[region.UUID] = region;
          $scope.estates[region.EstateName][region.UUID] = region;
        } else {
          $scope.estates[region.EstateName] = {};
          regions[region.UUID] = region;
          $scope.estates[region.EstateName][region.UUID] = region;
        }
      }
    }

    function modUserEstates(event, estate) {
      if ($scope.auth.UUID === estate.Owner || $scope.auth.UUID in estate.Managers || $scope.auth.AccessLevel > 249) {
        if (!(estate.Name in $scope.estates)) {
          $scope.estates[estate.Name] = {};
        }
      } else {
        //remove estate, this user no longer controlls it
        if (estate.Name in $scope.estates) {
          delete $scope.estates[estate.Name];
          for (var uuid in estate.Regions) {
            if (uuid in regions) {
              delete regions[uuid];
            }
          }
        }
      }
    }

    $scope.$on('EstateUpdate', modUserEstates);
    $scope.$on('RegionUpdate', estateifyRegion);
    $scope.$on('RegionStatusUpdate', function(event, status) {
      if (status.UUID in regions) {
        $timeout(function() {
          $scope.estates[regions[status.UUID].EstateName][status.UUID].Status = status;
        });
      }
    });

    for (var ID in mgm.estates) {
      modUserEstates('', mgm.estates[ID]);
    }

    for (var uuid in mgm.regions) {
      estateifyRegion('', mgm.regions[uuid]);
    }

  });

angular.module('mgmApp')
  .controller('ManageRegionSettingsCtrl', function($scope, $modalInstance, region, estates, hosts) {

    $scope.region = region;
    $scope.estates = estates;
    $scope.hosts = hosts;

    $scope.close = function() {
      $modalInstance.close();
    };

    $scope.setXY = function(x, y){
      console.log('Set x,y to: ' + x + ', ' + y);
    }

    $scope.setEstate = function(estate){
      console.log('Set estate to: ' + estate.Name);
    }

    $scope.setHost = function(host){
      console.log('Set host to: ' + host.Hostname);
    }
  });
