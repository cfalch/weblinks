(function() {
	var app = angular.module('weblinks', []);

	app.controller('WebLinksController', [ '$http', function($http){
		var linksApp = this;
		linksApp.groups = [];
		$http.get('urls.json').success(function(data){
			linksApp.groups = data;
		});
	} ]);

})();
