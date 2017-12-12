var myApp = angular.module("myModule",[]);

myApp.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

myApp.service('fileUpload', ['$http', function ($http) {
    this.uploadFileAndFieldsToUrl = function(file, fields, uploadUrl){
		console.log(file);
        var fd = new FormData();
		console.log(fields);
        fd.append('file', file);
		for(var i = 0 ; i < fields.length; i++){
			console.log(fields[i].name, fields[i].data);
            fd.append(fields[i].name, fields[i].data);
		}	
		$http(
		{
		   method: 'POST',
		   url: uploadUrl,
		   data: fd, 
           transformRequest: angular.identity,
           headers: {'Content-Type': undefined}		   
		}).then(function successCallback(response) {
			if(JSON.stringify(response) != '{}' && response.data.status == "200"){
					window.location.replace("http://localhost:8080/SuccessEntry.html");
			}else{
				alert(response.data.message);
			}
		});
    }
}]);



myApp.controller('myController', ['$scope', 'fileUpload','$http','$filter', function($scope,fileUpload,$http,$filter){
	$scope.$watch('myFile', function(newFileObj){
        if(newFileObj)
            $scope.filename = newFileObj.name; 
    });
	
	var loginIcon = {
		name : "Login",
		loginPngLoc : "/Images/login.png",
		message : "Sign In"
	};
	$scope.loginIcon = loginIcon ;
	
	var successIcon = {
	    name : "Success",
		successPngLoc : "/Images/Success.png",
		message : "Sucessfully Data Submitted"
	};
	$scope.successIcon = successIcon ;
			
	$scope.submitLoginData = function(){
	var data = {
		username: $scope.userName,
		password : $scope.password
	}
	
	
	$http(
		{
		   method: 'POST',
		   url: 'http://localhost:8080/loginData/', 
		   data: data  
		}).then(function successCallback(response) {
			if(JSON.stringify(response) != '{}' && response.data.status == "200"){
				window.location.replace("http://localhost:8080/StudentDetails.html");
			}else{
				alert(response.data.message);
			}				
		});
	}
	
	$scope.submitApplicantData = function(){
        var file = $scope.myFile;
		console.log(file);
		var data = {
				name: $scope.name,
				ssn : $scope.ssn,
				dob : $filter('date')($scope.dob,'yyyy-MM-dd'),
				gender : $scope.gender,		
				email : $scope.emailId,
				countryCode : $scope.countryCode,
				phoneNumber : $scope.phoneNumber,
				address : $scope.address		
		};
	$http(
		{
		   method: 'POST',
		   url: 'http://localhost:8080/applicantData/', 
		   data: data  
		}).then(function successCallback(response) {
			if(JSON.stringify(response) != '{}' && response.data.status == "200"){
				var fields = [{"name" : "id", "data" : response.data.id},
							  {"name" : "rev", "data" : response.data.revid}];
				var uploadUrl = "http://localhost:8080/applicantDoc/";
				fileUpload.uploadFileAndFieldsToUrl(file, fields, uploadUrl);
			}else{
				alert(response.data.message);
			}				
		});		
	}
	
	$scope.successEntry = function(){
		window.location.replace("http://localhost:8080/LoginPage.html");		
	}
	
}]);