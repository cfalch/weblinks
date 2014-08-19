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
				this.editGroup = "";
				this.isEditing = function(groupName) {
					console.log("isEditing(" + groupName + ")");
					return groupName == this.editGroup;
				};
				this.setEditing = function(groupName) {
					console.log("setEditing(" + groupName + ")");
					this.editGroup = groupName;
				};
				this.linkToAdd = {};
				this.addLink = function(group) {
					group.links.push(this.linkToAdd);
					this.linkToAdd = {};
					this.setEditing('');
				};
			}], controllerAs:'linkCtrl'
		};
	});

})();
