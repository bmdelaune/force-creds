var sfdcCredsApp = angular.module('sfdcCredsApp', ['sfdcCredsStorage']).config( [
    '$compileProvider',
    function( $compileProvider )
    {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|safari-extension|#):/);
        // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
    }
]);

var x2js_instance = new X2JS();

sfdcCredsApp.controller('loginListCtrl', ['$scope','storageCtrl', function ($scope,storageCtrl) {
	$scope.logins = storageCtrl.logins;
	$scope.groups = storageCtrl.groups;
	$scope.openCred = storageCtrl.openCred;
	$scope.xmlvalue = '';
	$scope.moveGroup = function(){storageCtrl.moveGroupToIndex($scope.groups[0],1)};
	$scope.importFromForceCom = function() {
		storageCtrl.convertForceComLogins($scope.xmlvalue.replace(/%3A/g,':'));
		$scope.xmlvalue = '';
	}
	$scope.remove = function(login){
		storageCtrl.removeByLogin(login);
	}
	$scope.popopen = function() {
		safari.application.activeBrowserWindow.openTab().url = '../popover.html';
	}
	$scope.editLogin = function(displayId){
		console.log(displayId);
		$('.edit_login:not(#edit_login_'+displayId+')').slideUp();
		$('.edit_icon:not(#edit_icon_'+displayId+')').addClass('octicon-pencil').removeClass('octicon-chevron-down');
		$('#edit_login_'+displayId).slideToggle();
		$('#edit_icon_'+displayId).toggleClass('octicon-pencil').toggleClass('octicon-chevron-down');
	}
	$scope.blurLogin = function(displayId) {
		$('#edit_login_'+displayId).slideUp();
		$('#edit_icon_'+displayId).addClass('octicon-pencil').removeClass('octicon-chevron-down');
	}

	storageCtrl.newCred('email@email.com','heythere','aldhfkdahgf','https://login.salesforce.com');
	storageCtrl.newCred('email2@email.com','heythere','aldhfkdahgf','https://login.salesforce.com');
}]);


sfdcCredsApp.filter('escape', function() {
	return window.encodeURIComponent;
});

sfdcCredsApp.filter('group', function() {
	return function(input,group) {
		var out = {};
		angular.forEach(input, function(cred,key) {
			if (cred.group == group) {
				out[key] = cred;
			}
		});
		return out;
	};
});

