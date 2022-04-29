(function () {
	var app = angular.module('weblinks', ['ngclipboard']);

	var jsonData = [];
	var jsonFrom = ""; // Keeps track of source for jsonData
	var LOCAL_STG = "localstorage";
	var DISK = "disk";
	var gremlin = getARandomGremlin();

	// Grabs a random(ish) glyph for when no results match search. This setup at app bootstrap prevents
	// the randomize from running at each keystroke.
	function getARandomGremlin() {
		var gremlins = [
			"👹", "😇", "🙃", "🤓", "😱", "😵", "👿", "👺", "💀", "👻", "🙀", "👀",
			"🐙", "🎃", "👾", "🚧", "⛩", "💣", "🛡", "☠", "🔮", "🗿", "⁉", "🃏"];
		var randomishIndex = Math.floor(Math.random() * (gremlins.length)) + 0;
		return gremlins[randomishIndex];
	}

	function parseSpid($window) {
		var secretPublicId;
		if ($window.location) {
			var searchParams = new URLSearchParams($window.location.search);
			secretPublicId = searchParams.get('spid');
		}
		return secretPublicId;
	}

	// To share between linkCtrl and searchCtrl
	app.factory('QueryString', function ($filter) {
		return {
			data: "", // The text of the search filter
			getFilteredLinks: getFilteredLinks
		};
		function getFilteredLinks() {
			if (!this.data) {
				return;
			}
			if (this.data.indexOf('/') === 0) { // then search groupName instead of links
				var groups = $filter('groupFilter')(jsonData, this.data);
				var results = [];
				angular.forEach(groups, function (group) {
					results = results.concat(group.links);
				});
				return results;
			} else {
				var allLinks = [];
				angular.forEach(jsonData, function (group) {
					allLinks = allLinks.concat(group.links)
				});
				var results = $filter('linkFilter')(allLinks, this.data);
				return results;
			}
		}
	});

	app.factory('JsonFactory', ["$window", "$http", "$log", function ($window, $http, $log) {
		var AWS_ENDPT = 'https://7fhx9eq7g5.execute-api.us-east-1.amazonaws.com/default';
		var AWS_APIKEY = 'eNj8evospb6YHRJhpwvpe540LrGhPtdT5HwslpOw';
		function localStg() {
			$log.info('in JsonFactory.localStg()');
			jsonData = loadJsonLocal();
			jsonFrom = LOCAL_STG;
			return jsonData;
		};
		function load() {
			return new Promise((resolve) => {
				$log.info('in JsonFactory.load()');
				// Apr 2022 - I spent hours trying to eliminate the dup calls to the backend, and whenever I
				// was able to do so, I couldn't get the page to update properly. All I was doing was
				// setting a simple boolean on 'this' (the factory), like so:
				// if (this.isLoading) {
				//  resolve(jsonData)
				// } else {
				// 	this.isLoading = true
				//  $http.get(...).success(function (data) {
				//    ...
				//  	this.isLoading = false;
				//  });
				// There were no errors in the console, and it loaded the results from localStorage fine, but
				// it wouldn't update with the server data when this checking was in place.
				var secretPublicId = parseSpid($window);
				var config = {
					headers: { 'x-api-key': AWS_APIKEY },
					params: { 'SecretPublicID': secretPublicId }
				}
				$http.get(AWS_ENDPT + '/queryWeblinks', config)
					.success(function (data) {
						jsonData = data;
						jsonFrom = DISK;
						saveJsonLocal(jsonData);
						resolve(jsonData);
					});
			});
		};
		function save(updatedJson) {
			var secretPublicId = parseSpid($window);
			return new Promise((resolve, reject) => {
				var secretPublicId = parseSpid($window);
				var config = {
					headers: { 'x-api-key': AWS_APIKEY },
					params: { 'SecretPublicID': secretPublicId }
				}
				$http.put(AWS_ENDPT + '/putWeblinks', updatedJson, config)
					.success(function (response) {
						jsonData = updatedJson;
						saveJsonLocal(updatedJson);
						resolve();
					}).error(function (data) {
						$log.error('DID NOT SAVE!');
						alert('DID NOT SAVE');
						$log.info(data);
						reject();
					});
			});
		};
		return { localStg, load, save };
	}]);

	app.controller('SearchController', function (QueryString) {
		this.queryStr = QueryString;
		this.gotoSingleWeblink = function () {
			var matches = QueryString.getFilteredLinks();
			if (matches.length === 1) {
				window.location = matches[0].url;
			}
		};
	});

	app.controller('GremlinController', ['QueryString', function (QueryString) {
		this.getFilteredLinks = function () {
			return QueryString.getFilteredLinks();
		};
		this.getGremlin = function () {
			return gremlin;
		}
	}]);

	app.controller('LinkController', ['JsonFactory', 'QueryString', '$http', '$log', '$window', '$scope', function (JsonFactory, QueryString, $http, $log, $window, $scope) {
		this.queryStr = QueryString;
		var secretPublicId = parseSpid($window);
		$scope.secretPublicId = secretPublicId;

		// 1. Load from local storage for immediate display of links
		this.groups = JsonFactory.localStg();

		// 2. Immediately fetch from server to update page with persisted data
		JsonFactory.load().then(jsonResult => {
			$log.info('setting results from server fetch... length = ' + JSON.stringify(jsonResult).length);
			this.groups = jsonResult;
			$scope.$apply(() => {
				this.groups = jsonResult;
			});
			$scope.$digest();
		});

		this.editGroup = "";
		this.isEditing = function (groupName) {
			return groupName == this.editGroup;
		};
		this.setEditing = function (groupName) {
			this.editGroup = groupName;
		};

		this.linkToAdd = {};
		this.addLink = function (group) {
			group.links.push(this.linkToAdd);
			JsonFactory.save(this.groups).then(() => {
				this.linkToAdd = {};
				this.setEditing('');
				$scope.$apply();
			});
		};
		this.getThemeClassName = function () {
			return getThemeClass(secretPublicId);
		};
	}]);

	app.directive("displaySearch", function () {
		return {
			restrict: 'E',
			templateUrl: 'app/views/display-search.html',
			controller: 'SearchController'
		};
	})

	app.directive("displayWeblinks", function () {
		return {
			restrict: 'E',
			templateUrl: 'app/views/display-weblinks.html',
			controller: 'LinkController'
		};
	});

	app.directive("jsonDataControls", ["$log", function ($log) {
		return {
			restrict: 'E',
			templateUrl: 'app/views/json-data-controls.html',
			controller: function ($timeout) {
				this.copyClicked = false;
				this.localStorageModalEnabled = function () {
					// Disabling since moving to AWS, I don't need the functionality the modal gave me, mainly
					// the ability to copy the JSON in order to manually update the json data file.
					return false;
				};
				this.isJsonFromLocalStorage = function () {
					return jsonFrom === LOCAL_STG;
				};
				this.isJsonFromDisk = function () {
					return jsonFrom === DISK;
				};
				this.getWeblinksAsJson = function () {
					return angular.toJson(jsonData, true);
				};
				this.clearJsonLocal = function () {
					if (typeof (Storage) != "undefined") {
						window.localStorage.removeItem("weblinks-json");
						jsonFrom = DISK;
						$log.info('Removed weblinks-json from local storage');
					}
				};
				this.copySuccess = function (e) {
					var self = this; // for $timeout closure
					e.clearSelection();
					this.copyClicked = true; // Allows ng-class to add the animation class
					$timeout(function () {
						self.copyClicked = false; // Allows ng-class to remove the animation class
					}, 2000);
				}
			}, controllerAs: 'dataCtrl'
		};
	}]);

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
	app.directive('autofocus', ['$timeout', function ($timeout) {
		return {
			restrict: 'A',
			link: function ($scope, $element) {
				$timeout(function () {
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
	app.directive('clearWithEsc', function () {
		return {
			require: '?ngModel',
			link: function (scope, element, attrs, controller) {
				element.on('keydown keyup', function (event) {
					/* Firefox resets the control to its original value on keyup. So
						 listening on keydown ONLY works for Chrome/IE, but not for Ffox. */
					if (event.keyCode != 27) {
						return;
					}
					scope.$apply(function () {
						controller.$setViewValue('');
						controller.$render();
						event.preventDefault();
					});
				});
			},
		};
	});

	var loadJsonLocal = function () {
		var weblinksJson = [];
		if (typeof (Storage) !== "undefined") {
			var data = window.localStorage.getItem("weblinks-json");
			if (data) {
				weblinksJson = angular.fromJson(data);
			}
		}
		return weblinksJson;
	};

	var saveJsonLocal = function (jsonToWrite) {
		if (typeof (Storage) !== "undefined") {
			window.localStorage.setItem("weblinks-json", angular.toJson(jsonToWrite, true)); // pretty-print
		} else {
			alert("Could not write to local storage!");
		}
	};

	var clearJsonLocal = function () {
		if (typeof (Storage) !== "undefined") {
			window.localStorage.removeItem("weblinks-json");
		}
	};

	app.getFilteredGroups = function (queryString, groups) {
		var queryStr = queryString.toLowerCase();
		var matches = [];
		for (var i = 0; i < groups.length; i++) {
			var group = group[i];
			var groupName = group.groupName.toLowerCase(); // name??
			if (groupName.indexOf(queryStr) >= 0) {
				// Return all links within group as matches
				for (var j = 0; j < group.links.length; j++) {
					matches.push(group.links[j]);
				}
			}
		}
	}

	/**
	 * Filters links for a single group. Since 'matches' represents filtered links only for this group,
	 * we can't use it for determining how many total page matches result.
	 */
	app.filter('linkFilter', function ($filter) {
		return function (items, search) {
			var matches = items;
			if (search.indexOf("/") !== 0) { // Don't filter when searchStr starts with '/'
				matches = $filter('filter')(items, search); // exec angular's filter
			}
			return matches;
		};
	});

	app.filter('groupFilter', function ($filter) {
		return function (items, search) {
			var matches = items;
			if (search.indexOf("/") === 0) {
				search = search.substring(1); // strips leading '/'
				matches = [];
				angular.forEach(items, function (item) {
					if (item.groupName.toLowerCase().indexOf(search.toLowerCase()) >= 0) {
						matches.push(item);
					}
				});
			} else {
				matches = $filter('linkFilter')(items, search);
			}
			return matches;
		};
	});

	app.directive('themeSwitcher', function () {
		return {
			restrict: 'E',
			templateUrl: 'app/views/theme-switcher.html',
			controller: function ($scope) {
				this.set = function (themeName) {
					setTheme(themeName, $scope.secretPublicId);
				}
			}, controllerAs: 'themeCtrl'
		};
	});

})();

// TODO: Figure out why IE caches so aggressively. See if I can't refactor our a dataRefresh()
// function that can be used by dataCtrl and linkCtrl. Then I may be able to force a dataRefresh
// via $http from within clearJsonLocal();
