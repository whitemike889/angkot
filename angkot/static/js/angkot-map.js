(function() {

"use strict"

var mod = angular.module('angkotMap', []);

mod.factory('mapService', function() {

  return {
    view: {
      center: [0,0],
      zoom: 1,
    },
    viewport: undefined,
    maxBounds: undefined,
    editable: false,
    routes: [],
    fitRoutesToBounds: true,

    setCenter: function(center) {
      this.view.center = center;
    },

    setZoom: function(zoom) {
      this.view.zoom = zoom;
    },
  }

});

mod.directive('angkotMap', function() {

  var controller = ['$scope', '$element', function($scope, $element) {

    var map, editor;

    $scope.init = function() {
      initMap();
      initEditor();
    }

    $scope.$watch('data.view', function(value) {
      var pos = value.center;
      var center = [pos[1], pos[0]];
      var zoom = value.zoom;
      map.setView(center, zoom);
    }, true);

    $scope.$watch('data.viewport', function(viewport) {
      if (!viewport) return;

      var a = [viewport[0][1], viewport[0][0]];
      var b = [viewport[1][1], viewport[1][0]];
      var bounds = new L.LatLngBounds([a, b]);
      map.fitBounds(bounds);
    });

    $scope.$watch('data.maxBounds', function(bounds) {
      if (!bounds) return;

      var a = [bounds[0][1], bounds[0][0]];
      var b = [bounds[1][1], bounds[1][0]];
      var b = new L.LatLngBounds([a, b]);
      map.setMaxBounds(b);
    });

    $scope.$watch('data.editable', function(value) {
      editor.setEditable(!!value);
    });

    $scope.$watch('data.routes', function(routes) {
      var res = [];
      var bounds;
      for (var i=0; i<routes.length; i++) {
        var route = toLatLng(routes[i]);
        res.push(route);

        var bound = new L.LatLngBounds(route);
        if (!bounds) bounds = bound;
        else bounds.extend(bound);
      }
      editor.setRoutes(res);
      editor.setEditable($scope.data.editable);

      if ($scope.data.fitRoutesToBounds && bounds) {
        map.fitBounds(bounds);
      }
    });

    var initMap = function() {
      var center = [0, 0]
      map = L.mapbox.map($element[0], $scope.mapboxKey, {
          boxZoom: false,
          minZoom: 7,
          maxZoom: 17,
        }).setView(center, 1);
    }

    var initEditor = function() {
      editor = new L.Angkot.Route({editable: false});
      editor.addTo(map);

      editor.on('route:add', function(e) {
        var routes = editor.getRoutes();
        $scope.$apply(function() {
          $scope.data.routes.push(toLngLat(routes[e.index]));
          $scope.fireRouteChanged();
        });
      });

      editor.on('route:delete', function(e) {
        $scope.$apply(function() {
          $scope.data.routes.splice(e.index, 1);
          $scope.fireRouteChanged();
        });
      });

      editor.on('route:update', function(e) {
        var routes = editor.getRoutes();
        $scope.$apply(function() {
          $scope.data.routes[e.index] = toLngLat(routes[e.index]);
          $scope.fireRouteChanged();
        });
      });
    }

    var toLngLat = function(path) {
      var res = [];
      for (var i=0; i<path.length; i++) {
        var p = path[i];
        res.push([p.lng, p.lat]);
      }
      return res;
    }

    var toLatLng = function(path) {
      var res = [];
      for (var i=0; i<path.length; i++) {
        var p = path[i];
        res.push([p[1], p[0]]);
      }
      return res;
    }

  }];

  return {
    restrict: 'E',
    template: '<div class="angkot-map"></div>',
    replace: true,
    controller: controller,
    scope: {
      mapboxKey: '=',
      data: '=mapData',
      fireRouteChanged: '&onroutechanged',
    },
    link: function(scope, element, attrs) {
      scope.init();
    }
  };

});

})();
