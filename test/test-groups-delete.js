'use strict';

var _ = require('lodash');
var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

var assert = chai.assert;
chai.should();
chai.use(chaiHttp);

describe('GroupsDelete', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";

  before(function(done) {
    utils.setUp(function(aSuperToken, aTestToken){
      superToken = aSuperToken;
      testToken = aTestToken;
      done();
    });
  });

  after(function(done) {
    utils.tearDown(done);
  });

  it('should delete a non existent group and get an error', function(done) {
    chai.request(server)
    .delete('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'abc.com'
    })
    .then(function(result) {
      result.should.have.status(400);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals(400);
      result.body.name.should.equals('error');
      result.body.message.should.equals('Group Not Found: abc.com');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should delete a root group with a superUser', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'abc.com',
      signatures: ['~Super_User1'],
      writers: ['~Super_User1'],
      members: [],
      readers: ['everyone'],
      signatories: ['~Super_User1']
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
      .get('/groups?id=abc.com')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('groups');
      result.body.groups.should.be.a('array');
      result.body.groups.length.should.equal(1);
      result.body.groups[0].should.have.property('tauthor');
      result.body.groups[0].tauthor.should.equal(superUser);
      return chai.request(server)
        .delete('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com'
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals('ok');
      return chai.request(server)
      .get('/groups?id=abc.com')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(400);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals(400);
      result.body.name.should.equals('error');
      result.body.message.should.equals('Group Not Found: abc.com');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should delete a non root group with a non superUser', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'abc.com',
      signatures: ['~Super_User1'],
      writers: ['~Test_User1'],
      members: [],
      readers: ['everyone'],
      signatories: ['~Test_User1']
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com/xy',
          signatures: ['~Test_User1'],
          writers: ['~Test_User1'],
          members: [],
          readers: ['everyone'],
          signatories: ['~Test_User1']
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
      .get('/groups?id=abc.com/xy')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('groups');
      result.body.groups.should.be.a('array');
      result.body.groups.length.should.equal(1);
      return chai.request(server)
        .delete('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com/xy'
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals('ok');
      return chai.request(server)
      .get('/groups?id=abc.com/xy')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(400);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals(400);
      result.body.name.should.equals('error');
      result.body.message.should.equals('Group Not Found: abc.com/xy');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should delete a group where the user is not the writer and get an error', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'abc.com',
      signatures: ['~Super_User1'],
      writers: ['~Super_User1'],
      members: [],
      readers: ['everyone'],
      signatories: ['~Super_User1']
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
      .get('/groups?id=abc.com')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('groups');
      result.body.groups.should.be.a('array');
      result.body.groups.length.should.equal(1);
      return chai.request(server)
        .delete('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com'
        });
    })
    .then(function(result) {
      result.should.have.status(400);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals(400);
      result.body.name.should.equals('forbidden');
      result.body.message.should.equals('Forbidden');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should delete a root group that has child groups and get an error', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'abc.com',
      signatures: ['~Super_User1'],
      writers: ['~Super_User1'],
      members: [],
      readers: ['everyone'],
      signatories: ['~Super_User1']
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com/de',
          signatures: ['~Super_User1'],
          writers: ['~Super_User1'],
          members: [],
          readers: ['everyone'],
          signatories: ['~Super_User1']
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
      .get('/groups?id=abc.com/de')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('groups');
      result.body.groups.should.be.a('array');
      result.body.groups.length.should.equal(1);
      result.body.groups[0].should.have.property('tauthor');
      result.body.groups[0].tauthor.should.equal(superUser);
      return chai.request(server)
        .delete('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com'
        });
    })
    .then(function(result) {
      result.should.have.status(400);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals(400);
      result.body.name.should.equals('Can not delete the group');
      result.body.message.should.equals('Group has descendants: abc.com/de');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should delete a group that is member of other groups and get an error', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'abc.com',
      signatures: ['~Super_User1'],
      writers: ['~Super_User1'],
      members: ['abc.com/de'],
      readers: ['everyone'],
      signatories: ['~Super_User1']
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com/de',
          signatures: ['~Super_User1'],
          writers: ['~Super_User1'],
          members: [],
          readers: ['everyone'],
          signatories: ['~Super_User1']
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
      .get('/groups?id=abc.com/de')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('groups');
      result.body.groups.should.be.a('array');
      result.body.groups.length.should.equal(1);
      result.body.groups[0].should.have.property('tauthor');
      result.body.groups[0].tauthor.should.equal(superUser);
      return chai.request(server)
        .delete('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'abc.com/de'
        });
    })
    .then(function(result) {
      result.should.have.status(400);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('status');
      result.body.status.should.equals(400);
      result.body.name.should.equals('Can not delete the group');
      result.body.message.should.equals('Group is member of: abc.com');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

});





