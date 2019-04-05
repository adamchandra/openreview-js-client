'use strict';

require('shelljs/global');
var chai = require('chai');
var chaiHttp = require('chai-http');
// var elasticsearch = require('elasticsearch');
// var crypto = require('crypto');
// var Shared = require('mmap-object');

// var mongoDatabase = require('../scripts/mongo_database.js');

chai.use(chaiHttp);

process.env.NODE_ENV = 'test';

// var config = require('config-node')({
//   ext: 'json',
//   env: process.env.NODE_ENV
// });

const port = 3000;


var server = `http://localhost:${port}`;
var superUser = `~SuperUser1`;
var testUser = 'test@test.com';
// var instanceServer;

// var esClient;
// if (config.useElasticSearch) {
//   esClient = new elasticsearch.Client({
//     host: config.elasticsearch.host,
//     log: 'info'
//   });
// }

// var createIndex = function() {
//   if (esClient) {
//     console.log('Create ES index');
//     return removeIndex()
//     .then(result => {
//       return esClient.indices.create({
//         index: config.elasticsearch.index,
//         body: {
//           mappings: {
//             doc: {
//               properties: {
//                 invitation: {
//                   type: 'keyword'
//                 },
//                 readers: {
//                   type: 'keyword'
//                 },
//                 nonreaders: {
//                   type: 'keyword'
//                 },
//                 forum: {
//                   type: 'keyword'
//                 },
//                 id: {
//                   type: 'keyword'
//                 },
//                 original: {
//                   type: 'keyword'
//                 },
//                 replyto: {
//                   type: 'keyword'
//                 }
//               }
//             }
//           }
//         }
//       });
//     });

//   }
//   return Promise.resolve();
// };

// var removeIndex = function() {
//   if (esClient) {
//     console.log('Remove ES index');
//     return esClient.indices.delete({
//       index: config.elasticsearch.index,
//       ignoreUnavailable: true
//     });
//   }
//   return Promise.resolve();
// };

// var setupDatabase = function() {
//   return mongoDatabase.setup(config);
// };

// var startServer = function() {
//   console.log('Start server');

//   const sharedObject = new Shared.Create('./shared_keys');
//   if (!sharedObject.bearerSecret) {
//     sharedObject.bearerSecret = crypto.randomBytes(16).toString('hex');
//   }
//   sharedObject.close();

//   return new Promise((resolve, reject) => {
//     require('../server')(expressServer => {
//       instanceServer = expressServer;
//       resolve();
//     });
//   });
// };

// var stopServer = function() {
//   console.log('Stop server');

//   return new Promise((resolve, reject) => {
//     instanceServer.close();

//     setTimeout(function(){
//       resolve();
//     }, 1000);

//   });
// };

// var dropGraph = function() {
//   return mongoDatabase.tearDown(config);
// };

var createUserP = function(email, first, middle, last, password) {
  return chai.request(server)
    .post('/register')
    .send({
      'email': email,
      'password': password,
      'name': {
        first: first,
        middle: middle,
        last: last
      }
    });
};

var activateUserP = function(user, content) {
  return chai.request(server)
    .put('/activate/' + user)
    .send({
      content: content
    });
};

var loginUserP = function(user, password) {
  return chai.request(server)
    .post('/login')
    .set('User-Agent', 'test-create-script')
    .send({
      'id': user,
      'password': password
    });
};

var createGroupP = function(id, user, token, readers, members) {
  return chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + token)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': id,
      'signatures': [user],
      'writers': [id, user],
      'readers': (readers !== undefined) ? readers : ['everyone'],
      'members': (members !== undefined) ? members : [user],
      'signatories': [id, user]
    });
};

var createAndLoginUserFullName = function(id, first, middle, last) {
  return createUserP(id, first, middle, last, '12345678')
  .then(response => {
    response.should.have.status(200);
    response.should.be.json;
    response.body.should.be.a('object');
    response.body.should.have.property('id');
    return activateUserP(id, {
      names: response.body.content.names,
      emails: response.body.content.emails,
      preferredEmail: response.body.content.preferredEmail
    });
  })
  .then(function(response){
    response.should.have.status(200);
    return loginUserP(id, '12345678');
  })
  .then(function(response) {
    response.should.have.status(200);
    response.should.be.json;
    response.body.should.be.a('object');
    response.body.should.have.property('token');
    return response.body.token;
  });
};

var createAndLoginUser = function(id, first, last) {
  return createAndLoginUserFullName(id, first, '', last);
};

var createGroup = function(id, user, token, readers, done) {
  createGroupP(id, user, token, readers)
  .end((err, res) =>{
    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('id');
    res.body.id.should.equal(id);
    done();
  });
};

var createGroupWithMembers = function (id, user, token, readers, members, done) {
  createGroupP(id, user, token, readers, members)
  .end((err, res) => {
    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('id');
    res.body.id.should.equal(id);
    if (typeof done === 'function') {
      done();
    }
  });
};

var deleteGroup = function(id, token, done) {
  chai.request(server)
    .post('/groups/delete')
    .set('Authorization', 'Bearer ' + token)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': id
    })
    .end((err, response) => {
      if (response.status !== 200) {
        console.log(response);
      }
      response.should.have.status(200);
      if (typeof done === 'function') {
        done();
      }
    });
};

var createInvitationP = function(id, user, token, content, readers, writers, signatures, nonreaders, invitees) {
  return chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + token)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': id,
      'signatures': [user],
      'writers': [user],
      'invitees': (invitees !== undefined) ? invitees : ['~'],
      'readers': ['everyone'],
      'nonreaders': [],
      'reply' : {
        readers: (readers !== undefined) ? readers : { values: ['everyone'] },
        signatures: (signatures !== undefined) ? signatures : { 'values-regex': '.+' },
        writers: (writers !== undefined) ? writers : { 'values-regex': '.+' },
        nonreaders: (nonreaders !== undefined) ? nonreaders : { 'values-regex': '.*' },
        content: content
      }
    });
};

var createInvitation = function(id, user, token, content, readers, done) {
  createInvitationP(id, user, token, content, readers)
  .end((err, res) => {
    if (res.status !== 200) {
      console.log('Invitation error', res);
    }

    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('id');
    res.body.id.should.equal(id);
    if (typeof done === 'function') {
      done();
    }
  });
};

var createExpiredInvitationP = function(id, user, token, content, readers, expired) {
  return chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + token)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': id,
      'duedate': expired ? Date.now() - 1000 : Date.now() + (60 * 60 * 1000),
      'signatures': [user],
      'writers': [user],
      'invitees': ['~'],
      'readers': ['everyone'],
      'nonreaders': [],
      'reply' : {
        readers: (readers !== undefined) ? readers : { values: ['everyone'] },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        nonreaders: { 'values-regex': '.*' },
        content: content
      }
    });
};

var assertIdResponse = function(response) {
  response.should.have.status(200);
  response.should.be.json;
  response.body.should.be.a('object');
  response.body.should.have.property('id');
  response.body.id.should.be.a('string');
  response.body.id.should.not.equals('');
  return response.body.id;
};


var createTagInvitationP = function(id, user, token, content, readers, multiReply, taskCompletionCount, writers, signatures, nonreaders, invitees) {
  return chai.request(server)
  .post('/invitations')
  .set('Authorization', 'Bearer ' + token)
  .set('User-Agent', 'test-create-script')
  .send({
    'id': id,
    'signatures': [user],
    'writers': [user],
    'invitees': (invitees !== undefined) ? invitees : ['~'],
    'readers': ['everyone'],
    'nonreaders': [],
    'multiReply': (multiReply !== undefined) ? multiReply : false,
    'taskCompletionCount': (taskCompletionCount !== undefined) ? taskCompletionCount : 0,
    'reply': {
      readers: (readers !== undefined) ? readers : {values: ['everyone']},
      signatures: (signatures !== undefined) ? signatures : {'values-regex': '.+'},
      writers: (writers !== undefined) ? writers : {'values-regex': '.+'},
      nonreaders: (nonreaders !== undefined) ? nonreaders : {'values-regex': '.*'},
      content: content
    }
  });
};


var createTagInvitation = function(id, user, token, content, readers, multiReply, taskCompletionCount, done) {
  createTagInvitationP(id, user, token, content, readers, multiReply, taskCompletionCount)
  .end((err, res) => {
    if (res.status !== 200) {
      console.log('Invitation error: ', res);
    }
    res.should.have.status(200);
    res.should.be.json;
    res.body.should.be.a('object');
    res.body.should.have.property('id');
    res.body.id.should.equal(id);
    if (typeof done === 'function') {
      done();
    }
  });
};

var setUp = function(done) {
  return createAndLoginUser(superUser, 'Super', 'User')
          .then(superToken => createAndLoginUser(testUser, 'Test', 'User')
                .then(testToken => done(superToken, testToken)))
    .catch(error => {
      console.error('setup error', error);
      done(error);
    });
};

var tearDown = function(done) {
  return done();
  // stopServer()
  //   .then(removeIndex)
  //   .then(dropGraph)
  //   .then(done)
  //   .catch(error => {
  //     console.error('tearDown error', error);
  //     done(error);
  //   });
};

module.exports = {
  server: server,
  setUp: setUp,
  tearDown: tearDown,
  createGroup: createGroup,
  createGroupWithMembers: createGroupWithMembers,
  createGroupP: createGroupP,
  deleteGroup: deleteGroup,
  createInvitation: createInvitation,
  createInvitationP: createInvitationP,
  createTagInvitation: createTagInvitation,
  createExpiredInvitationP: createExpiredInvitationP,
  createAndLoginUser: createAndLoginUser,
  createAndLoginUserFullName: createAndLoginUserFullName,
  assertIdResponse: assertIdResponse
};
