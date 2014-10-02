(function() {
	var app = angular.module('weblinks', []);

	// To share between linkCtrl and searchCtrl
	app.factory('QueryString', function() {
		return {data:""}; 
	});

	var jsonFromLocalStorage = false;
	var jsonFromDisk = false;
	var jsonData = [];

	app.controller('SearchController', function(QueryString) {
		this.queryStr = QueryString;
	});

	app.controller('LinkController', ['QueryString', '$http', function(QueryString, $http) {
		var linksApp = this;
		this.queryStr = QueryString;
		linksApp.groups = loadJsonLocal();
		if(linksApp.groups.length > 0) {
			jsonFromLocalStorage = true;
		} else {
			$http.get('urls.json').success(function(data) {
				linksApp.groups = data;
				jsonFromDisk = true;
			});
		}
		jsonData = linksApp.groups;
		this.editGroup = "";
		this.isEditing = function(groupName) {
			return groupName == this.editGroup;
		};
		this.setEditing = function(groupName) {
			this.editGroup = groupName;
		};
		this.linkToAdd = {};
		this.addLink = function(group) {
			group.links.push(this.linkToAdd);
			$http.post('urls.json', linksApp.groups).success(function(data) {
				//alert('Saved urls.json!');
			}).error(function(data) {
				//alert('DID NOT SAVE');
				//console.log(data);
			});
			saveJsonLocal(linksApp.groups);
			jsonFromLocalStorage = true;
			jsonFromDisk = false;
			jsonData = linksApp.groups; // Update global var; Shouldn't this already be updated by reference?
			this.linkToAdd = {};
			this.setEditing('');
		};
		this.getThemeClassName = function() {
			return getThemeClass();
		};
	}]);

	app.directive("displayWeblinks", function() {
		return {
			restrict: 'E',
			templateUrl: 'display-weblinks.html',
			controller: 'LinkController'
		};
	});

	app.directive("jsonDataControls", function() {
		return {
			restrict: 'E',
			templateUrl: 'json-data-controls.html',
			controller: function() {
				this.isJsonFromLocalStorage = function() {
					return jsonFromLocalStorage;
				};
				this.isJsonFromDisk = function() {
					return jsonFromDisk;
				};
				this.getWeblinksAsJson = function() {
					return angular.toJson(jsonData, true);
				};
				this.clearJsonLocal = function() {
					if(typeof(Storage) != "undefined") {
						window.localStorage.removeItem("weblinks-json");
						jsonFromLocalStorage = false;
						jsonFromDisk = true;
					}
				};
			}, controllerAs: 'dataCtrl'
		};
	});

	/** Can't seem to get this to work, do the asynchronous nature of the callback
	var getWeblinks = function($http) {
		var weblinks = [];
		$http.get('urls.json').success(function(data) {
			weblinks = data;
			//alert(angular.toJson(weblinks));
			return weblinks;
		});
	};
	**/

	var loadJsonLocal = function() {
		var weblinksJson = [];
		if(typeof(Storage) != "undefined") {
			var data = window.localStorage.getItem("weblinks-json");
			if(data) {
				weblinksJson = angular.fromJson(data);
			}
		}
		return weblinksJson;
	};

	var saveJsonLocal = function(jsonToWrite) {
		if(typeof(Storage) != "undefined") {
			window.localStorage.setItem("weblinks-json", angular.toJson(jsonToWrite, true)); // pretty-print
		} else {
			alert("Could not write to local storage!");
		}
	};

	var clearJsonLocal = function() {
		if(typeof(Storage) != "undefined") {
			window.localStorage.removeItem("weblinks-json");
		}
	};

})();

// NEXT: Figure out why IE caches so agressively. See if I can't refactor our a dataRefresh()
// function that can be used by dataCtrl and linkCtrl. Then I may be able to force a dataRefresh
// via $http from within clearJsonLocal();