
/**
 * Until there's a UI feature to select a theme, use the browser's console to execute
 * > setTheme('themeName')
 */
function setTheme(themeName, secretPublicId) {
	if(themeName === 'bluish') {
		changeTheme("linkGroupBody", "linkGroup", secretPublicId);
	} else if (themeName === 'clean') {
		changeTheme("linkGroup2Body", "linkGroup2", secretPublicId);
	} else if (themeName === 'dark') {
		changeTheme("linkGroupGlowBody", "linkGroupGlow", secretPublicId);
	}
}

function changeTheme(bodyClassName, groupClassName, secretPublicId) {
	var divName = "link-group";
	var elements = document.getElementsByName(divName);
	for(var i = 0; i < elements.length; i++) {
		elements[i].className = groupClassName;
	}
	document.body.className = bodyClassName;
	saveTheme(bodyClassName, groupClassName, secretPublicId);
}

// Declare some global keys for local storage
var bodyClassNameKey = "weblinks-body-classname-";
var groupClassNameKey = "weblinks-group-classname-"

// Saves current theme to local storage
function saveTheme(bodyClassName, groupClassName, secretPublicId) {
	if(typeof(Storage) != "undefined") {

		window.localStorage.setItem(bodyClassNameKey + secretPublicId, bodyClassName);
		window.localStorage.setItem(groupClassNameKey + secretPublicId, groupClassName)
	}
}

// Loads saved theme from local storage
function loadTheme() {
	var searchParams = new URLSearchParams(window.location.search);
	var secretPublicId = searchParams.get('spid');
	if(typeof(Storage) != "undefined") {
		var bodyClassName = window.localStorage.getItem(bodyClassNameKey + secretPublicId);
		var groupClassName = window.localStorage.getItem(groupClassNameKey + secretPublicId)
		if(bodyClassName !== null && groupClassName !== null) {
			changeTheme(bodyClassName, groupClassName, secretPublicId);
		}
	}
}

function getThemeClass(secretPublicId) {
	if(typeof(Storage) != "undefined") {
		var defaultClass = "linkGroup";
		var savedClass = window.localStorage.getItem(groupClassNameKey + secretPublicId);
		return savedClass || defaultClass;
	}
}