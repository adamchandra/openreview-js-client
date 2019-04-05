var fs = require('fs');
var path = require('path');
var randomstring = require("randomstring");

module.exports = {
  setFile: setFile,
  logHeaders: logHeaders,
  logResponse: logResponse,
  logNote: logNote,
  buildTitle: buildTitle,
  generateUserId: generateUserId
};

function setFile(requestParams, context, ee, next) {
	requestParams.multipart = [
		{
			body: fs.createReadStream(path.join(__dirname, '../data/paper.pdf'))
		}
	];
  return next(); // MUST be called for the scenario to continue
}

function buildTitle(requestParams, context, ee, next) {
  context.vars['title'] = 'Stress test paper_' + Date.now() + ' by ' + context.vars.username;
  return next();
}

function generateUserId(requestParams, context, ee, next) {
  console.log('generateUserId');

  var id = randomstring.generate({
    length: 6,
    charset: 'alphabetic'
  }).toLowerCase();

  console.log('id', id);
  context.vars.userEmail = 'test_' + id + '@mail.com';
  context.vars.userLast = id;
  console.log('return', context.vars);
  return next();
}

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.headers);
  return next(); // MUST be called for the scenario to continue
}

function logResponse(requestParams, response, context, ee, next) {
  console.log("Response: ", JSON.stringify(response.body));
  return next(); // MUST be called for the scenario to continue
}

function logNote(requestParams, response, context, ee, next) {
  console.log("Notes: " + JSON.parse(response.body).notes[0].id, JSON.parse(response.body).notes[0]);
  return next(); // MUST be called for the scenario to continue
}
