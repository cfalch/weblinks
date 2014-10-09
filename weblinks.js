(function() {
	var app = angular.module('weblinks', []);

	var jsonData = [];
	var jsonFrom = ""; // Keeps track of source for jsonData
	var LOCAL_STG = "localstorage";
	var DISK = "disk";

	// To share between linkCtrl and searchCtrl
	app.factory('QueryString', function() {
		return {data:""}; // The text of the search filter
	});

	app.controller('SearchController', function(QueryString) {
		this.queryStr = QueryString;
		this.gotoSingleWeblink = function() {
			var matches = app.getFilteredLinks(this.queryStr.data, jsonData);
			if(matches.length == 1) {
				window.location = matches[0].url;
			}
		};
	});

	app.controller('LinkController', ['QueryString', '$http', '$log', function(QueryString, $http, $log) {
		var linksApp = this;
		this.queryStr = QueryString;
		linksApp.groups = loadJsonLocal();
		if(linksApp.groups.length > 0) {
			jsonData = linksApp.groups;
			jsonFrom = LOCAL_STG;
		} else {
			$http.get('urls.json').success(function(data) {
				jsonData = data;
				linksApp.groups = data;
				jsonFrom = DISK;
			});
		}
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
				$log.info('Saved urls.json!');
			}).error(function(data) {
				$log.error('DID NOT SAVE!');
				$log.info(data);
			});
			saveJsonLocal(linksApp.groups);
			jsonFrom = LOCAL_STG;
			jsonData = linksApp.groups; // Update global var; Shouldn't this already be updated by reference?
			this.linkToAdd = {};
			this.setEditing('');
		};
		this.getThemeClassName = function() {
			return getThemeClass();
		};
		this.getFilteredLinks = function() {
			return app.getFilteredLinks(this.queryStr.data, linksApp.groups);
		};
	}]);

	app.directive("displaySearch", function() {
		return {
			restrict: 'E',
			templateUrl: 'display-search.html',
			controller: 'SearchController'
		};
	})

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
					return jsonFrom === LOCAL_STG;
				};
				this.isJsonFromDisk = function() {
					return jsonFrom === DISK;
				};
				this.getWeblinksAsJson = function() {
					return angular.toJson(jsonData, true);
				};
				this.clearJsonLocal = function() {
					if(typeof(Storage) != "undefined") {
						window.localStorage.removeItem("weblinks-json");
						jsonFrom = DISK;
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

	app.getFilteredLinks = function(queryString, groups) {
		// I'm pretty much re-implementing the filter that's already run in the page. I couldn't figure
		// out how to combine the filter results from EACH GROUP in order to tally up the search results
		// to see if there were no matches in any group.
		var queryStr = queryString.toLowerCase();
		var matches = [];
		for(var i = 0; i < groups.length; i++) {
			var group = groups[i];
			for(var j = 0; j < group.links.length; j++) {
				var webl = group.links[j];
				var weblTitle = webl.title.toLowerCase();
				var weblUrl = webl.url.toLowerCase();
				if( (weblTitle.indexOf(queryString) >= 0) 
					|| (weblUrl.indexOf(queryString) >= 0) ) {
					matches.push(webl);
				}
			}
		}
		return matches;
	};

})();

// NEXT: Figure out why IE caches so agressively. See if I can't refactor our a dataRefresh()
// function that can be used by dataCtrl and linkCtrl. Then I may be able to force a dataRefresh
// via $http from within clearJsonLocal();
// TODO: Add a route so that it's not necessary to type in the .html page.
