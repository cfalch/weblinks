(function() {
	var app = angular.module('weblinks', []);

	app.directive("displayWeblinks", function() {
		return {
			restrict: 'E',
			templateUrl: 'display-weblinks.html',
			controller : ['$http', function($http) {
				var linksApp = this;
				linksApp.groups = [];
				$http.get('urls.json').success(function(data) {
					linksApp.groups = data;
				});
			}], controllerAs:'linkCtrl'
		};
	});

})();
