'use strict';

var chai = require('chai');
var assert = chai.assert;
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('AddRemoveMembers', function() {

  var server = utils.server;
  var superUser = "test@openreview.net";
  var superToken;
  var testUser = "test@test.com";
  var testToken;

  before(function(done) {
    utils.setUp(function(aSuperToken, aTestToken) {
      superToken = aSuperToken;
      testToken = aTestToken;
      done();
    });
  });

  after(function(done) {
    utils.tearDown(done);
  });


  it('should create group "ijk.com" with no members, then should add the member "michael" to "ijk.com"', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'ijk.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': [],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error, response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.equal('ijk.com');

      chai.request(server)
      .put('/groups/members')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        'id': 'ijk.com',
        'members': ['michael']
      })
      .end(function(error, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.id.should.equal('ijk.com');
        response.body.members.should.eql(['michael']);
        response.body.tcdate.should.not.equal(response.body.tmdate);
        chai.request(server)
        .get('/groups?id=ijk.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(error,response) {
          response.should.have.status(200);
          response.body.should.have.property('groups');
          response.body.groups.should.be.a('array');
          response.body.groups[0].id.should.equal('ijk.com');
          response.body.groups[0].members.should.be.a('array');
          response.body.groups[0].members[0].should.equal('michael');
          chai.request(server)
          .get('/groups?member=michael')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function(error, response) {
            response.should.have.status(200);
            response.body.should.have.property('groups');
            response.body.groups.should.be.a('array');
            response.body.groups.length.should.equal(3);
            response.body.groups[0].id.should.equal('(anonymous)');
            response.body.groups[1].id.should.equal('everyone');
            response.body.groups[2].id.should.equal('ijk.com');
            done();
          });
        });
      });
    });
  });

  it('should create group "def.com" with no members, then should add two members',function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'def.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': [],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error, response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.equal('def.com');

      chai.request(server)
      .put('/groups/members')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        'id': 'def.com',
        'members': ['memberA','memberB']
      })
      .end(function(error, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.id.should.equal('def.com');
        response.body.members.should.eql(['memberA','memberB']);
        chai.request(server)
        .get('/groups?id=def.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(error,response) {
          response.should.have.status(200);
          response.body.should.have.property('groups');
          response.body.groups.should.be.a('array');
          response.body.groups[0].id.should.equal('def.com');
          response.body.groups[0].members.should.be.a('array');
          response.body.groups[0].members.should.contain('memberA');
          response.body.groups[0].members.should.contain('memberB');
          done();
        });
      });
    });
  });

  it('should create group "abc.com" with two members, then should add the member "memberC" to it', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'abc.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': ['memberA','memberB'],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error,response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.equal('abc.com');

      chai.request(server)
      .put('/groups/members')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        'id': 'abc.com',
        'members': ['memberC']
      })
      .end(function(error, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.id.should.equal('abc.com');
        response.body.members.should.eql(['memberA','memberB','memberC']);
        chai.request(server)
        .get('/groups?id=abc.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(error,response) {
          response.should.have.status(200);
          response.body.should.have.property('groups');
          response.body.groups.should.be.a('array');
          response.body.groups[0].id.should.equal('abc.com');
          response.body.groups[0].members.should.be.a('array');
          response.body.groups[0].members.should.have.length(3);
          response.body.groups[0].members.should.contain('memberA');
          response.body.groups[0].members.should.contain('memberB');
          response.body.groups[0].members.should.contain('memberC');
          done();
        });
      });
    });
  });

  it('should create group "xyz.com" with two members, then should remove one of the members', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'xyz.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': ['memberA','memberB'],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error,response) {
      chai.request(server)
      .delete('/groups/members')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        'id': 'xyz.com',
        'members': ['memberA']
      })
      .end(function(error,response) {
        response.should.have.status(200)
        response.should.be.json;
        response.body.id.should.equal('xyz.com');
        response.body.members.should.eql(['memberB']);
        response.body.tcdate.should.not.equal(response.body.tmdate);
        chai.request(server)
        .get('/groups?id=xyz.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(error,response) {
          response.should.have.status(200);
          response.body.should.have.property('groups');
          response.body.groups.should.be.a('array');
          response.body.groups[0].id.should.equal('xyz.com');
          response.body.groups[0].members.should.be.a('array');
          response.body.groups[0].members[0].should.equal('memberB');
          chai.request(server)
          .get('/groups?member=memberA')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function(error, response) {
            response.should.have.status(200);
            response.body.should.have.property('groups');
            response.body.groups.should.be.a('array');
            response.body.groups.length.should.equal(4);
            response.body.groups[0].id.should.equal('(anonymous)');
            response.body.groups[1].id.should.equal('everyone');
            response.body.groups[2].id.should.equal('abc.com');
            response.body.groups[3].id.should.equal('def.com');
            done();
          });
        });
      });
    });
  });

  it('should create group "qwe.com" with three members, then should remove them all', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'qwe.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': ['memberA','memberB','memberC'],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error,response) {
      chai.request(server)
      .delete('/groups/members')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        'id': 'qwe.com',
        'members': ['memberA','memberB','memberC']
      })
      .end(function(error,response) {
        response.should.have.status(200)
        response.should.be.json;
        response.body.id.should.equal('qwe.com');
        response.body.members.should.eql([]);
        chai.request(server)
        .get('/groups?id=qwe.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(error,response) {
          response.should.have.status(200);
          response.body.should.have.property('groups');
          response.body.groups.should.be.a('array');
          response.body.groups[0].id.should.equal('qwe.com');
          response.body.groups[0].members.should.be.a('array');
          response.body.groups[0].members.should.be.empty;
          done();
        });
      });
    });
  });

  it('should send an add request without a body.id or body.members and get an error',function(done) {
    chai.request(server)
    .put('/groups/members')
    .set('Authorization', 'Bearer ' + superToken)
    .send( {} )
    .end(function(error,response) {
      response.should.have.status(400);
      response.body.errors.should.be.a('array');
      response.body.errors.length.should.equal(1);
      response.body.errors[0].should.equal('group id is missing');
      done();
    })
  });

  it('should send a remove request without a body.id or body.members and get an error',function(done) {
    chai.request(server)
    .delete('/groups/members')
    .set('Authorization', 'Bearer ' + superToken)
    .send( {} )
    .end(function(error,response) {
      response.should.have.status(400);
      response.body.errors.should.be.a('array');
      response.body.errors.length.should.equal(1);
      response.body.errors[0].should.equal('group id is missing');
      done();
    })
  });

  it("should send an add request for a group that doesn't exist and get an error", function(done) {
    chai.request(server)
    .put('/groups/members')
    .set('Authorization', 'Bearer ' + superToken)
    .send({
      'id': 'badGroup',
      'members': ['memberA','memberB']
    })
    .end(function(error, response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.errors[0].should.equal('Group Not Found: badGroup');
      done()
    })
  })

  it('should create a group using the superuser, then should try to add a member using a user that does not have permission',function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'abc.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': ['memberA','memberB'],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error,response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.equal('abc.com');

      chai.request(server)
      .put('/groups/members')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        'id': 'abc.com',
        'members': ['memberC']
      })
      .end(function(error, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.should.have.property('name');
        response.body.name.should.equal('forbidden');
        done()
      });
    });
  });

  it('should create group "ijk.com" with no members, then should add the member with spaces and get an error', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'ijq.com',
      'signatures': ["~Super_User1"],
      'writers': ["~Super_User1"],
      'members': [],
      'readers': ['everyone'],
      'signatories': []
    })
    .end(function(error, response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.equal('ijq.com');

      chai.request(server)
      .put('/groups/members')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        'id': 'ijq.com',
        'members': [' michael@gmail.com']
      })
      .end(function(error, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.should.have.property('errors');
        response.body.errors[0].should.equal('invalid group id  michael@gmail.com');
        done();
      });
    });
  });

});
