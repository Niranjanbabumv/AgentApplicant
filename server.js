var express = require('express');
var path = require('path');
var fs = require("fs");
var bodyParser = require('body-parser');
var nano = require('nano')('http://localhost:8080');
var app = express();
var multer  = require('multer');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var upload = multer({dest:__dirname + '/upload'});
var type = upload.single('file');

app.use('/', express.static(__dirname + '/'));
app.use('/', express.static(__dirname +'/Images'));

var cloudantUserName = "premdutt09";
var cloudantPassword = "sharma06@";
var dbCredentials_url = "https://"+cloudantUserName+":"+cloudantPassword+"@"+cloudantUserName+".cloudant.com"; // Set this to your own account 

// Initialize the library with my account. 
var cloudant = require('cloudant')(dbCredentials_url);

var dbForLogin = cloudant.db.use("logindetails");
var dbForApplicantData = cloudant.db.use("applicantdata");
var dbForAdminRequestTable = cloudant.db.use("adminrequesttable"); 


// viewed at http://localhost:8080
app.get('/', function(req, res) {
console.log("Open LoginPage.html page");
    res.sendFile(path.join(__dirname + '/LoginPage.html'));
});

app.post('/loginData', function (req, res) {
console.log("Got a POST request for LoginPage.html page");
console.log(JSON.stringify(req.body));
var userName = req.body.username;
console.log(userName);
var password = req.body.password;
console.log(password);
	dbForLogin.get(userName, function(err, body) {
	  if (!err) {
		var dbPassword = body.agentPassword;
		if(dbPassword === password){
			var response = {
				status  : 200,
				message : 'Success'
			}
			res.send(JSON.stringify(response));	
		}else{
			var response = {
				status  : 300,
				message : 'Username and Password does not match'
			}
			res.send(JSON.stringify(response));	
		}	
	  }else{	
	  console.log(err);
			var response = {
				status  : 400,
				message : 'Username does not exists'
			}
			res.send(JSON.stringify(response));	
		}
	});
});



app.post('/applicantData', function (req, res) {
console.log("Got a POST request for StudentDetails.html page");
   var requestId = "RE0";
   var applicantData = JSON.parse(JSON.stringify(req.body));
   var uniqueId = applicantData.name.substring(0, 3) + applicantData.dob.substring(0, 2) + applicantData.ssn.substring(0,3);
   dbForAdminRequestTable.list(function(err, body) {
	  if (!err) {
		console.log(body);  
		body.rows.forEach(function(doc) {
		  requestId = doc.id;
		});
	  }
	requestId = requestId.replace(/(\d+)/, function(){return arguments[1]*1+1} );
	var requestDetails = {
		requestDate : new Date().toJSON().slice(0,10).replace(/-/g,'/'),
		applicantName : applicantData.name,
		status : 'Applied',
		digitalId : uniqueId
	}
   	dbForApplicantData.insert(applicantData, uniqueId, function(err, body) {
			  if (!err){
				dbForAdminRequestTable.insert(requestDetails, requestId, function(err, body) {
					  if (!err){
						console.log("Data inserted in admin request table.");	
					  }else{
							var response = {
									status  : 100,
									message : 'Data not inserted successfully in admin request table.'
							}
							res.send(JSON.stringify(response));
					  }	
					});
				var response = {
						status  : 200,
						message : 'Data inserted successfully in applicant data table.',
						id : body.id,
						revid : body.rev
				}
				res.send(JSON.stringify(response));
			  }else{
				var response = {
						status  : 300,
						message : 'Data not inserted successfully in applicant data table.'
				}
				res.send(JSON.stringify(response));
			  }
		});
	});
});

app.post('/applicantDoc', type , function (req, res) {
	fs.readFile(__dirname + '/upload/' + req.file.filename, function(err, data) {
	  if (!err) {
		dbForApplicantData.attachment.insert(req.body.id, req.file.originalname, data, req.file.mimetype,{ rev: req.body.rev }, function(err, body) {
			if (!err){
				fs.unlink(__dirname + '/upload/' + req.file.filename, function (err) {
					  if (!err)
						console.log('File deleted!');
					  else
						console.log(err);	
				});
				var response = {
						status  : 200,
						message : 'Document uploaded successfully in applicant data table.'
				}
				res.send(JSON.stringify(response));
			  }else{
				var response = {
						status  : 300,
						message : 'Document not uploaded successfully in applicant data table.'
				}
				res.send(JSON.stringify(response));
			  }
		});
	  }
	});
});
app.listen(8080);