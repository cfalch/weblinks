(function() {
	var app = angular.module('weblinks', []);

	var jsonData = [];
	var filteredLinks = [];
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
			if(filteredLinks.length == 1) {
				window.location = filteredLinks[0].url;
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
			$http.get('app/data/urls.json').success(function(data) {
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
			$http.post('app/data/urls.json', linksApp.groups).success(function(data) {
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
			return filteredLinks;
		};
	}]);

	app.directive("displaySearch", function() {
		return {
			restrict: 'E',
			templateUrl: 'app/views/display-search.html',
			controller: 'SearchController'
		};
	})

	app.directive("displayWeblinks", function() {
		return {
			restrict: 'E',
			templateUrl: 'app/views/display-weblinks.html',
			controller: 'LinkController'
		};
	});

	app.directive("jsonDataControls", function() {
		return {
			restrict: 'E',
			templateUrl: 'app/views/json-data-controls.html',
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

	/**
	 * Sets focus in the selected input
	 */
	app.directive('autofocus', ['$timeout', function($timeout) {
		return {
			restrict: 'A',
			link: function($scope, $element) {
				$timeout(function() {
					$element[0].focus();
				});
			}
		}
	}]);


	/* 	
	 * Clears the form input with the ESC key.
	 * This modifies the behavior of the browser, which I'm generally against, but this is a 
	 * convenience jsut for me, so I'll allow it ;-) 
	 */
/* !!
	Works in Chrome
	Works in IE11
	DOES NOT work in Firefox
   !!
*/
	app.directive('clearWithEsc', function() {
	    return {
	        require: '?ngModel',
	        link: function(scope, element, attrs, controller) {
	            element.on('keydown keyup', function(event) {
	            	/* Firefox resets the control to its original value on keyup. So
	            	   listening on keydown ONLY works for Chrome/IE, but not for Ffox. */
	                if (event.keyCode != 27) {
	                	return;
					}
	                scope.$apply(function() {
	                    controller.$setViewValue('');
	                    controller.$render();
	                    event.preventDefault();
	                });
	            });
	        },
	    };
	});

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

	app.getFilteredGroups = function(queryString, groups) {
		var queryStr = queryString.toLowerCase();
		var matches = [];
		for(var i = 0; i < groups.length; i++) {
			var group = group[i];
			var groupName = group.groupName.toLowerCase(); // name??
			if(groupName.indexOf(queryStr) >= 0) {
				// Return all links within group as matches
				for(var j = 0; j < group.links.length; j++) {
					matches.push(group.links[j]);
				}
			}
		}
	}

	app.filter('linkFilter', function($filter) {
		return function(items, search) {
			var matches = items;
			if(search.indexOf("h:") !== 0) { // Don't filter when searchStr starts with 'h:'
				matches = $filter('filter')(items, search); // exec angular's filter
			}
			filteredLinks = matches;
			return matches;
		};
	});

	app.filter('groupFilter', function($filter) {
		return function(items, search) {
			var matches = items;
			if(search.indexOf("h:") === 0) {
				search = search.substring(2); // strips 'h:'
				matches = [];
				angular.forEach(items, function(item) {
					if(item.groupName.toLowerCase().indexOf(search.toLowerCase()) >= 0) {
						matches.push(item);
					}
				});
			} else {
				matches = $filter('linkFilter')(items, search);
			}
			filteredLinks = matches;
			return matches;
		};
	});

	app.directive("themeSwitcher", function() {
		return {
			restrict: 'E',
			templateUrl: 'app/views/theme-switcher.html',
			controller: function() {
				this.set = function(themeName) {
					setTheme(themeName);
				}
			}, controllerAs: 'themeCtrl'
		};
	});

})();

// TODO: Figure out why IE caches so aggressively. See if I can't refactor our a dataRefresh()
// function that can be used by dataCtrl and linkCtrl. Then I may be able to force a dataRefresh
// via $http from within clearJsonLocal();
