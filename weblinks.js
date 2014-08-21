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
					return groupName == this.editGroup;
				};
				this.setEditing = function(groupName) {
					this.editGroup = groupName;
				};
				this.linkToAdd = {};
				this.addLink = function(group) {
					group.links.push(this.linkToAdd);
					$http.post('urls.json', linksApp.groups).success(function(data) {
						alert('Saved urls.json!');
					}).error(function(data) {
						alert('DID NOT SAVE');
						console.log(data);
					});
					this.linkToAdd = {};
					this.setEditing('');
				};
			}], controllerAs:'linkCtrl'
		};
	});

})();

// NEXT: Figure out how to persist changes to the JSON. Apparently I cannot simply POST the file - I have
// to POST to an app service somehow, and then have that service update the file.