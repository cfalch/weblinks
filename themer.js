
/**
 * Until there's a UI feature to select a theme, use the browser's console to execute
 * > setTheme('themeName')
 */
function setTheme(themeName) {
	if(themeName === 'bluish') {
		changeTheme("linkGroupBody", "linkGroup");
	} else if (themeName === 'clean') {
		changeTheme("linkGroup2Body", "linkGroup2");
	} else if (themeName === 'dark') {
		changeTheme("linkGroupGlowBody", "linkGroupGlow");
	}
}

function changeTheme(bodyClassName, groupClassName) {
	var divName = "link-group";
	var elements = document.getElementsByName(divName);
	for(var i = 0; i < elements.length; i++) {
		elements[i].className = groupClassName;
	}
	document.body.className = bodyClassName;
	saveTheme(bodyClassName, groupClassName);
}

// Declare some global keys for local storage
var bodyClassNameKey = "weblinks-body-classname";
var groupClassNameKey = "weblinks-group-classname"

// Saves current theme to local storage
function saveTheme(bodyClassName, groupClassName) {
	if(typeof(Storage) != "undefined") {
		var bodyClassName = window.localStorage.setItem(bodyClassNameKey, bodyClassName);
		var groupClassName = window.localStorage.setItem(groupClassNameKey, groupClassName)
	}
}

// Loads saved theme from local storage
function loadTheme() {
	if(typeof(Storage) != "undefined") {
		var bodyClassName = window.localStorage.getItem(bodyClassNameKey);
		var groupClassName = window.localStorage.getItem(groupClassNameKey)
		if(bodyClassName !== null && groupClassName !== null) {
			changeTheme(bodyClassName, groupClassName);
		}
	}
}

function getThemeClass() {
	if(typeof(Storage) != "undefined") {
		var defaultClass = "linkGroup";
		var savedClass = window.localStorage.getItem(groupClassNameKey);
		return savedClass || defaultClass;
	}
}