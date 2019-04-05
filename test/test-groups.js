'use strict';

var _ = require('lodash');
var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

var assert = chai.assert;
chai.should();
chai.use(chaiHttp);

describe('Groups', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";

  function createSimpleRootGroupP(id, permissions) {
    var perm = permissions || {};
    return chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: id,
      signatures: perm.signatures || [],
      writers: perm.writers || [],
      members: perm.members || [],
      readers: perm.readers || [],
      signatories: perm.signatories || [],
      web: perm.web || null
    }).then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.equal(id.toLowerCase());
      return response;
    });
  }

  before(function(done) {
    utils.setUp(function(aSuperToken, aTestToken){
      superToken = aSuperToken;
      testToken = aTestToken;
      done();
    });
  });

  var abcToken = null;
  before(function(done) {
    utils.createAndLoginUser("abc@test.com", "abc", "test").then(function(token) {
      abcToken = token;

      Promise.all([
        createSimpleRootGroupP("tiger", {members: ["abc@test.com"], signatories:['tiger'], readers:['tiger'], writers:['tiger']}),
        createSimpleRootGroupP("lion", {members: ["abc@test.com"], signatories:['lion'], readers:['lion'], writers:['lion']})
      ]).then(function(results) {
        return createSimpleRootGroupP("leopard", {signatories: ["lion", "leopard"], readers:['leopard'], writers:['leopard']});
      }).then(function(res) {
        done();
      });
    }, done);
  });

  after(function(done) {
    utils.tearDown(done);
  });

  describe('POST', function() {

    it('should fail to create new root group with ID "xyz.com" because user is not super', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'xyz.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': [user],
        'readers': [user],
        'signatories': [user]
      })
      .end(function(error, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].type.should.equal('forbidden');
        done();
      });
    });

    it('should create new root group with ID "abc.com" because user is super', function(done) {
      createSimpleRootGroupP('abc.com', { readers: ['everyone'] })
      .then(function() {
        return chai.request(server)
        .get('/groups?id=abc.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
      })
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(1);
        res.body.groups[0].should.have.property('tauthor');
        res.body.groups[0].tauthor.should.equal(superUser);
        return chai.request(server)
        .get('/groups?id=abc.com')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(1);
        response.body.groups[0].should.not.have.property('tauthor');
        response.body.groups[0].readers.should.eql(['everyone']);
        return chai.request(server)
        .get('/groups?id=abc.com&details=writable')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(1);
        response.body.groups[0].should.have.property('details');
        response.body.groups[0].details.should.have.property('writable');
        response.body.groups[0].details.writable.should.equal(false);
        return chai.request(server)
        .get('/groups?id=abc.com&details=writable')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(1);
        response.body.groups[0].should.have.property('details');
        response.body.groups[0].details.should.have.property('writable');
        response.body.groups[0].details.writable.should.equal(true);
        done();
      })
      .catch(function(error) {
        done(error);
      });
    });

    it('should fail to edit root group "bcd.com" because the user lacks permission', function(done) {
      createSimpleRootGroupP('bcd.com').then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'bcd.com',
          'signatures': ["abc@test.com"],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.name.should.equal('error');
          response.body.should.have.property('errors');
          response.body.errors.should.be.a('array');
          response.body.errors.length.should.equal(1);
          response.body.errors[0].type.should.equal('forbidden');
          response.body.errors[0].path.should.equal('id');
          response.body.errors[0].value.should.equal('bcd.com');
          response.body.errors[0].user.should.equal(user);
          done();
        });
      });
    });

    it('should fail to edit root group "cde.com" because the user lacks signatory permission', function(done) {
      createSimpleRootGroupP('cde.com', {writers: [user]}).then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'cde.com',
          'signatures': ["abc@test.com"],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {

          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.name.should.equal('error');
          response.body.should.have.property('errors');
          response.body.errors.should.be.a('array');
          response.body.errors.length.should.equal(1);
          response.body.errors[0].type.should.equal('notSignatory');
          response.body.errors[0].path.should.equal('signatures');
          response.body.errors[0].value.should.eql(['abc@test.com']);
          response.body.errors[0].user.should.equal(user);
          done();
        });
      });
    });

    it('should fail to edit root group "def.com" because the user lacks writer permission', function(done) {
      createSimpleRootGroupP('def.com').then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'def.com',
          'signatures': ["~Test_User1"],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.name.should.equal('error');
          response.body.should.have.property('errors');
          response.body.errors.should.be.a('array');
          response.body.errors.length.should.equal(1);
          response.body.errors[0].type.should.equal('forbidden');
          done();
        });
      });
    });

    it('should edit root group "efg.com" because the user has writer and signatory permission', function(done) {
      createSimpleRootGroupP('efg.com', {writers: [user]}).then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'efg.com',
          'signatures': ["~Test_User1"], // Test_User1 is a signatory of the user
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal("efg.com");
          chai.request(server)
          .get('/groups?id=efg.com')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function(error, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('groups');
            res.body.groups.should.be.a('array');
            res.body.groups.length.should.equal(1);
            res.body.groups[0].should.have.property('tauthor');
            res.body.groups[0].tauthor.should.equal(user);
            res.body.groups[0].signatures.should.eql(["~Test_User1"]);
            res.body.groups[0].writers.should.eql([user]);
            res.body.groups[0].members.should.eql([user]);
            res.body.groups[0].readers.should.eql([user]);
            res.body.groups[0].signatories.should.eql([user]);
            res.body.groups[0].nonreaders.should.eql([]);
            done();
          });
        });
      });
    });

    it('should edit root group "efg.org" because the user has writer and signatory permission through membership', function(done) {
      createSimpleRootGroupP('efg.org', {writers: ["tiger",'efg.org'], signatories:['efg.org'], readers:['efg.org']}).then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + abcToken) // abc@test.com is a member of tiger
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'efg.org',
          'signatures': ["leopard"], // abc@test.com is a member of lion and lion is a signatory of leopard.
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal("efg.org");
          done();
        });
      });
    });


    it('should fail to create group "fgh.com/1234" because the user lacks write permission on the parent, but should then succeed in modifying the group after it has been created', function(done) {
      createSimpleRootGroupP('fgh.com').then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'fgh.com/1234',
          'signatures': ["abc@test.com"],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.name.should.equal('error');
          response.body.should.have.property('errors');
          response.body.errors.should.be.a('array');
          response.body.errors.length.should.equal(1);
          response.body.errors[0].type.should.equal('forbidden');
          chai.request(server)
          .post('/groups')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'id': 'fgh.com/1234',
            'signatures': [],
            'writers': [user],
            'members': [user],
            'readers': [user],
            'signatories': [user]
          })
          .end(function(error, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.should.have.property('id');
            response.body.id.should.equal('fgh.com/1234');
            response.body.should.have.property('readers');
            response.body.readers.should.be.a('array');
            response.body.readers.length.should.equal(1);
            response.body.readers[0].should.equal(user)
            chai.request(server)
            .post('/groups')
            .set('Authorization', 'Bearer ' + testToken)
            .set('User-Agent', 'test-create-script')
            .send({
              'id': 'fgh.com/1234',
              'signatures': ["test@test.com"],
              'writers': [user],
              'members': [user],
              'readers': ['everyone'],
              'signatories': [user]
            })
            .end(function(error, response) {
              response.should.have.status(200);
              response.should.be.json;
              response.body.should.be.a('object');
              response.body.should.have.property('id');
              response.body.id.should.equal('fgh.com/1234');
              response.body.should.have.property('readers');
              response.body.readers.should.be.a('array');
              response.body.readers.length.should.equal(1);
              response.body.readers[0].should.equal('everyone')
              done()
            });
          });
        });
      });
    });


    it('should succeed in creating group "ghi.com/1234/5678" because the new signatures are writers of the group "ghi.com/1234", despite not being writers of "ghi.com"', function(done) {
      createSimpleRootGroupP('ghi.com', {writers: ['abc@test.com']}).then(function(response) {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + abcToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'ghi.com/1234',
          'signatures': ["~abc_test1"],
          'writers': [user],
          'members': [],
          'readers': [user],
          'signatories': []
        })
        .end(function(error, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal('ghi.com/1234')

          chai.request(server)
          .post('/groups')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'id': 'ghi.com/1234/5678',
            'signatures': ['~Test_User1'],
            'writers': ['~Test_User1'],
            'members': ['~Test_User1'],
            'readers': ['~Test_User1'],
            'signatories': ['~Test_User1']
          })
          .end(function(error, response) {
            response.should.have.status(200)
            done()
          })
        });
      });
    });

    it('should create group "hij.com/1234"', function(done) {
      createSimpleRootGroupP('hij.com', {writers: [user]}).then(function() {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'hij.com/1234',
          'signatures': [user],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal('hij.com/1234');
          done();
        });
      });
    });

    it('should create group "ijk.com" with web field', function(done) {
      chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'ijk.com',
          'signatures': [],
          'writers': [],
          'members': [],
          'readers': [],
          'signatories': [],
          'web': "function(){ return '<div>ijk.com</div>'; }"
        })
        .end(function(error, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.should.have.property('id');
            response.body.id.should.equal('ijk.com');
            chai.request(server)
            .get('/groups?id=ijk.com')
            .set('Authorization', 'Bearer ' + superToken)
            .end(function(error, response) {
              response.should.have.status(200);
              response.should.be.json;
              response.body.should.be.a('object');
              response.body.should.have.property('groups');
              response.body.groups.should.be.a('array');
              response.body.groups.length.should.equal(1);
              response.body.groups[0].should.have.property('id');
              response.body.groups[0].should.have.property('members');
              response.body.groups[0].should.have.property('readers');
              response.body.groups[0].id.should.equal('ijk.com');
              response.body.groups[0].members.should.be.a('array');
              response.body.groups[0].readers.should.be.a('array');
              response.body.groups[0].should.have.property('web');
              response.body.groups[0].web.should.be.a('string');
              response.body.groups[0].web.should.equal("function(){ return '<div>ijk.com</div>'; }");
              done();
            });
        });
    });

    it('Should fail to create group "jkl.com" with non-existent signature', function(done) {
      chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'jkl.com',
          signatures: ['jkl.com'],
          writers: [],
          readers: [],
          members: [],
          signatories: []
        })
        .end(function(err, res) {
          res.should.have.status(400);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('name');
          res.body.name.should.equal('error');
          res.body.should.have.property('errors');
          res.body.errors.should.be.a('array');
          res.body.errors.length.should.equal(1);
          res.body.errors[0].should.be.a('object');
          res.body.errors[0].should.have.property('type');
          res.body.errors[0].type.should.equal('Not Found');
          res.body.errors[0].should.have.property('path');
          res.body.errors[0].path.should.equal('signature[0]');
          res.body.errors[0].should.have.property('value');
          res.body.errors[0].value.should.equal('jkl.com');
          done();
        });
    });

    it('should create a group with a single signature and get the same signature', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'workshop',
        'signatures': [superUser],
        'writers': ['workshop'],
        'members': [],
        'readers': ['everyone'],
        'signatories': [superUser]
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('id');
        response.body.id.should.equal('workshop');
        chai.request(server)
        .get('/groups?id=workshop')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('groups');
          res.body.groups.should.be.a('array');
          res.body.groups.length.should.equal(1);
          res.body.groups[0].should.have.property('id');
          res.body.groups[0].should.have.property('members');
          res.body.groups[0].should.have.property('readers');
          res.body.groups[0].id.should.equal('workshop');
          res.body.groups[0].members.should.be.a('array');
          res.body.groups[0].members.should.eql([]);
          res.body.groups[0].readers.should.be.a('array');
          res.body.groups[0].readers.should.eql(['everyone']);
          res.body.groups[0].writers.should.be.a('array');
          res.body.groups[0].writers.should.eql(['workshop']);
          res.body.groups[0].signatures.should.be.a('array');
          res.body.groups[0].signatures.should.eql([superUser]);
          res.body.groups[0].signatories.should.be.a('array');
          res.body.groups[0].signatories.should.eql([superUser]);
          done();
        });
      });
    });

    it('should create a new group with email members and create its institutions', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'svg.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': ['mbok@iesl.cs.umass.edu'],
        'readers': ['everyone'],
        'signatories': [user]
      })
      .end(function(error, response) {
        response.should.have.status(200);
        response.should.be.json;
        utils.assertIdResponse(response);
        utils.createAndLoginUser('mbok@iesl.cs.umass.edu', 'Melisa', 'Bok')
        .then(function(token) {
          chai.request(server)
          .get('/groups?member=mbok@iesl.cs.umass.edu')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('groups');
            res.body.groups.should.be.a('array');
            res.body.groups.length.should.equal(9);
            res.body.groups[0].id.should.equal('(anonymous)');
            res.body.groups[1].id.should.equal('everyone');
            res.body.groups[2].id.should.equal('~');
            res.body.groups[3].id.should.equal('~Melisa_Bok1');
            res.body.groups[4].id.should.equal('mbok@iesl.cs.umass.edu');
            res.body.groups[5].id.should.equal('iesl.cs.umass.edu');
            res.body.groups[6].id.should.equal('cs.umass.edu');
            res.body.groups[7].id.should.equal('umass.edu');
            res.body.groups[8].id.should.equal('svg.com');
            done();
          })
        })
      });
    });

    it('should create a group with new members', function(done) {
      chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'groupa.com',
          'signatures': [superUser],
          'writers': [user],
          'members': ['newmail1@mail.com', 'newmail2@mail.com'],
          'readers': [user],
          'signatories': [user]
        })
        .end(function(error, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.members.should.be.a('array');
          response.body.members.length.should.equal(2);
          // check that some fields are removed
          response.body.should.not.have.property('_id');
          response.body.should.not.have.property('_key');
          response.body.should.not.have.property('_rev');
          done();
        });
    });

    it('should create a group with no duplicated groups', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'duplicated.com',
        'signatures': ["~Super_User1"],
        'writers': [user],
        'members': ['member1', 'member2', 'member3', 'member1', '~Test_User1'],
        'readers': [user],
        'signatories': [user]
      })
      .end(function(error, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.id.should.equal('duplicated.com');
        response.body.members.should.eql(['member1', 'member2', 'member3', '~Test_User1']);
        chai.request(server)
          .get('/groups?id=~Test_User1')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .end(function(err, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.groups[0].id.should.equal('~Test_User1');
            response.body.groups[0].members.should.eql([user]);
            done();
          });
      });
    });


  });

  describe('GET', function() {

    it('should return a list of public groups because no token is provided', function(done) {
      chai.request(server)
        .get('/groups')
        .end(function(err, res) {
          res.should.have.status(200);
          res.body.groups.length.should.equal(10);
          res.body.groups[0].id.should.equal('(anonymous)');
          res.body.groups[1].id.should.equal('everyone');
          res.body.groups[2].id.should.equal('~');
          res.body.groups[3].id.should.equal('(guest)');
          res.body.groups[4].id.should.equal('svg.com');
          res.body.groups[5].id.should.equal('workshop');
          res.body.groups[6].id.should.equal('abc.com');
          res.body.groups[7].id.should.equal('host');
          res.body.groups[8].id.should.equal('active_venues');
          res.body.groups[9].id.should.equal('fgh.com/1234');
          done();
        });
    });

    it('should return every group', function(done) {
      chai.request(server)
        .get('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          let groupIdSet = _.fromPairs(_.map(res.body.groups, g => [g.id, true]));

          var expectedGroupIds = [
            "~Test_User1", "~Super_User1", "host",
            "test@openreview.net", "lion", "tiger", "~abc_test1",
            "abc@test.com", "leopard", "test@test.com"
          ];
          _.forEach(expectedGroupIds, egId => assert(groupIdSet[egId], 'result contains ' + egId));
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('groups');
          res.body.groups.should.be.a('array');
          res.body.groups.length.should.not.equal(0);
          res.body.groups[0].should.have.property('id');
          done();
        });
    });

    it('should return a list of one group, which has id "lion"', function(done) {
      chai.request(server)
      .get('/groups?id=lion')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(1);
        res.body.groups[0].should.have.property('id');
        res.body.groups[0].should.have.property('members');
        res.body.groups[0].should.have.property('readers');
        res.body.groups[0].id.should.equal('lion');
        res.body.groups[0].members.should.be.a('array');
        res.body.groups[0].members[0].should.equal("abc@test.com");
        res.body.groups[0].readers.should.be.a('array');
        res.body.groups[0].readers.should.to.include('lion');
        done();
      });
    });


    it('should fail to return group "klm.com" because user is not a reader', function(done) {
      createSimpleRootGroupP('klm.com').then(function() {
        chai.request(server)
        .get('/groups?id=klm.com')
        .set('Authorization', 'Bearer ' + testToken)
        .end(function(error, response) {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.name.should.equal('forbidden');
          response.body.message.should.equal('Forbidden');
          response.body.should.have.property('errors');
          response.body.errors.should.be.a('array');
          response.body.errors.length.should.equal(1);
          response.body.errors[0].type.should.equal('forbidden');
          done();
        });
      });
    });

    it('should fail to return group "klm.com" because guest user is not a reader', function(done) {
      createSimpleRootGroupP('klm.com').then(function() {
        chai.request(server)
        .get('/groups?id=klm.com')
        .end(function(error, response) {
          response.should.have.status(400);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.name.should.equal('forbidden');
          response.body.message.should.equal('Forbidden');
          response.body.should.have.property('errors');
          response.body.errors.should.be.a('array');
          response.body.errors.length.should.equal(1);
          response.body.errors[0].type.should.equal('forbidden');
          response.body.errors[0].path.should.equal('id');
          response.body.errors[0].user.should.match(/guest_.*/);

          // do the request again to check the response is not cached
          chai.request(server)
          .get('/groups?id=klm.com')
          .end(function(error, response) {
            response.should.have.status(400);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.name.should.equal('forbidden');
            response.body.message.should.equal('Forbidden');
            response.body.should.have.property('errors');
            response.body.errors.should.be.a('array');
            response.body.errors.length.should.equal(1);
            response.body.errors[0].type.should.equal('forbidden');
            response.body.errors[0].path.should.equal('id');
            response.body.errors[0].user.should.match(/guest_.*/);
            done();
          });
        });
      });
    });

    it('should return group "lmn.com" because user is a member of a reader', function(done) {
      createSimpleRootGroupP('lmn.com', {readers: ["tiger"]}).then(function() {
        chai.request(server)
        .get('/groups?id=lmn.com')
        .set('Authorization', 'Bearer ' + abcToken)
        .end(function(error, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('groups');
          res.body.groups.should.be.a('array');
          res.body.groups.length.should.equal(1);
          res.body.groups[0].should.have.property('id');
          res.body.groups[0].should.have.property('members');
          res.body.groups[0].should.have.property('readers');
          res.body.groups[0].id.should.equal('lmn.com');
          res.body.groups[0].readers.should.be.a('array');
          res.body.groups[0].readers.should.to.include('tiger');
          done();
        });
      });
    });


    it('should return group "lion" containing member "abc@test.com"', function(done) {
      chai.request(server)
      .get('/groups?id=lion')
      .set('Authorization', 'Bearer ' + abcToken)
      .end(function(error, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(1);
        res.body.groups[0].should.have.property('id');
        res.body.groups[0].should.have.property('members');
        res.body.groups[0].members.should.to.include('abc@test.com');
        res.body.groups[0].should.have.property('readers');
        res.body.groups[0].id.should.equal('lion');
        res.body.groups[0].readers.should.be.a('array');
        done();
      });
    });

    it('should return groups "~", "~abc_test1", "lion", "everyone", "(anonymous)", "tiger", because they have the transitive member "abc@test.com"', function(done) {
      chai.request(server)
      .get('/groups?member=abc@test.com')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(200);
        let groupIdSet = _.fromPairs(_.map(res.body.groups, g => [g.id, true]));

        let expectedGroupIds = ["~","~abc_test1","lion","everyone","(anonymous)","tiger","test.com"];
        _.forEach(expectedGroupIds, egId => assert(groupIdSet[egId], 'result contains ' + egId));

        let unexpectedGroupIds = ["test@test.com","~Test_User1","(guest)"];
        _.forEach(unexpectedGroupIds, egId => assert(!groupIdSet[egId], 'result does not contain ' + egId));

        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(8);
        done();
      });
    });

    it('should get groups by unkown member and get an error', function(done) {
      chai.request(server)
      .get('/groups?member=dfaksjdlfkjd')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Group Not Found: dfaksjdlfkjd');
        done();
      });
    });

    it('should get groups by unkown signatory and get an error', function(done) {
      chai.request(server)
      .get('/groups?signatory=dfaksjdlfkjd')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Group Not Found: dfaksjdlfkjd');
        done();
      });
    });


    it('should return groups "~abc_test1", "abc@test.com", "lion", "tiger", "leopard", because they have the transitive signatory "abc@test.com"', function(done) {
      chai.request(server)
      .get('/groups?signatory=abc@test.com')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(200);
        let groupIdSet = _.fromPairs(_.map(res.body.groups, g => [g.id, true]));

        let expectedGroupIds = ["(anonymous)", "~abc_test1", "abc@test.com", "lion", "tiger", "leopard"];
        _.forEach(expectedGroupIds, egId => assert(groupIdSet[egId], 'result contains ' + egId));

        let unexpectedGroupIds = ["test@test.com","~Test_User1","(guest)"];
        _.forEach(unexpectedGroupIds, egId => assert(!groupIdSet[egId], 'result does not contain ' + egId));

        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(6);
        done();
      });
    });

    it('should return groups "~", "~abc_test1", "~Test_User1", because they match the list regex "~.*"', function(done) {
      chai.request(server)
      .get('/groups?regex=~.*')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(200);
        let groupIdSet = _.fromPairs(_.map(res.body.groups, g => [g.id, true]));

        let expectedGroupIds = ["~", "~Melisa_Bok1","~Super_User1", "~abc_test1", "~Test_User1"];
        _.forEach(expectedGroupIds, egId => assert(groupIdSet[egId], 'result contains ' + egId));

        let unexpectedGroupIds = ["test@test.com","(anonymous)","(guest)","everyone"];
        _.forEach(unexpectedGroupIds, egId => assert(!groupIdSet[egId], 'result does not contain ' + egId));

        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(5);
        done();
      });
    });

    it('should return no groups when get groups for the signatory guest and regex "~.*"', function(done) {
      chai.request(server)
      .get('/groups?regex=~.*&signatory=guest_1483634279961')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(0);
        done();
      });
    });

    it('should return anonymous group when get groups for the signatory guest and regex "(anonymous)"', function(done) {
      chai.request(server)
      .get('/groups?regex=\\(anonymous\\)&signatory=guest_1483634279961')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(error, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(1);
        res.body.groups[0].id.should.equal('(anonymous)');
        done();
      });
    });

    it('should create a new group with spaces and get an error', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'avdc ',
        'signatures': ["~Super_User1"],
        'writers': ["~Super_User1"],
        'members': ['member'],
        'readers': ['avdc '],
        'signatories': ["~Super_User1"]
      })
      .end(function(error, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.should.have.property('errors');
        response.body.errors[0].should.equal('invalid group id avdc ');
        done();
      });
    });


    it('should create another new group with spaces and get an error', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'avdc /2017',
        'signatures': ["~Super_User1"],
        'writers': ["~Super_User1"],
        'members': ['member'],
        'readers': ['avdc '],
        'signatories': ["~Super_User1"]
      })
      .end(function(error, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.should.have.property('errors');
        response.body.errors[0].should.equal('invalid group id avdc /2017');
        done();
      });
    });

    it('should get groups by id and the id contains wildcards', function(done) {
      chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'xyz.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': [user],
        'readers': [user],
        'signatories': [user]
      })
      .then(function(response) {
        response.should.have.status(200);
        return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'xyz.com/paper1',
          'signatures': ["~Test_User1"],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        });
      })
      .then(function(response) {
        response.should.have.status(200);
        return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'xyz.com/paper1/comment',
          'signatures': ["~Test_User1"],
          'writers': [user],
          'members': [user],
          'readers': [user],
          'signatories': [user]
        });
      })
      .then(function(response) {
        response.should.have.status(200);
        return chai.request(server)
        .get('/groups?id=xyz.com/paper.*/comment')
        .set('Authorization', 'Bearer ' + superToken);
      })
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.be.a('array');
        res.body.groups.length.should.equal(1);
        res.body.groups[0].id.should.equal('xyz.com/paper1/comment');
        done();
      })
      .catch(function(error) {
        done(error);
      })
    });


    it('should get groups where a automatically created member is member of and return a non empty result', function(done) {
      chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'reviewers',
          'signatures': ['~Super_User1'],
          'writers': ['~Super_User1'],
          'members': ['melisa@mail.com'],
          'readers': ['everyone'],
          'signatories': ['~Super_User1']
        })
        .end(function(error, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          response.body.id.should.equal('reviewers');
          chai.request(server)
          .get('/groups?member=melisa@mail.com')
          .set('Authorization', 'Bearer ' + superToken)
          .end(function(error, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.should.have.property('groups');
            response.body.groups.should.be.a('array');
            response.body.groups.length.should.equal(5);
            response.body.groups[0].id.should.equal('(anonymous)');
            response.body.groups[1].id.should.equal('everyone');
            response.body.groups[2].id.should.equal('reviewers');
            response.body.groups[3].id.should.equal('melisa@mail.com');
            response.body.groups[4].id.should.equal('mail.com');
            done();
          });
        });
    });

    it('should get groups using limit and offset', function(done) {
      chai.request(server)
      .get('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(47);
        return chai.request(server)
        .get('/groups?limit=10')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(14);
        return chai.request(server)
        .get('/groups?limit=10&offset=35')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(12);
        done();
      })
      .catch(function(error) {
        done(error);
      })
    });

    it('should get groups filtering by web field', function(done) {
      chai.request(server)
      .get('/groups?web=true')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(0);
        return chai.request(server)
          .post('/groups')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'id': 'reviewers',
            'signatures': ['~Super_User1'],
            'writers': ['~Super_User1'],
            'members': ['melisa@mail.com'],
            'readers': ['everyone'],
            'signatories': ['~Super_User1'],
            'web': 'this is a webfield'
          });
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        return chai.request(server)
        .get('/groups?web=true')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
      })
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(1);
        response.body.groups[0].should.have.property('web');
        response.body.groups[0].web.should.equals('this is a webfield');
        done();
      })
      .catch(function(error) {
        done(error);
      })
    });

    // Group Controller Tests
    it('should return group page HTML including webfield code', function(done) {
      createSimpleRootGroupP('lmn.com', {
        readers: ['everyone'],
        web: 'console.log("this is webfield js code");'
      }).then(function() {
        chai.request(server)
        .get('/group?id=lmn.com')
        .set('User-Agent', 'test-create-script')
        .end(function(error, res) {
          res.should.have.status(200);
          res.should.be.html;
          res.text.should.include('console.log("this is webfield js code");');
          done();
        });
      });
    });

    it('should return group page HTML and properly parse legacy webfield code', function(done) {
      createSimpleRootGroupP('lmn.com', {
        readers: ['everyone'],
        web: '<body><h1>Title</h1><script type="text/javascript">console.log("this is webfield js code");</script></body>'
      }).then(function() {
        chai.request(server)
        .get('/group?id=lmn.com')
        .set('User-Agent', 'test-create-script')
        .end(function(error, res) {
          res.should.have.status(200);
          res.should.be.html;
          res.text.should.include('$(\'#group-container\').append(\'<h1>Title</h1>\');');
          res.text.should.include('console.log("this is webfield js code");');
          done();
        });
      });
    });

    it('should try to access a non-existant group page and get a 404 page', function(done) {
      chai.request(server)
      .get('/group?id=zzz.com')
      .set('User-Agent', 'test-create-script-html')
      .end(function(error, res) {
        res.should.have.status(404);
        res.should.be.html;
        res.text.should.include('<pre class="error-message">Group not found</pre>');
        done();
      });
    });

    it('should try to access a group page without the right permissions and get a 403 page', function(done) {
      createSimpleRootGroupP('lmn.com', {
        web: 'console.log("this is webfield js code");'
      }).then(function() {
        chai.request(server)
        .get('/group?id=lmn.com')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script-html')
        .end(function(error, res) {
          res.should.have.status(403);
          res.should.be.html;
          res.text.should.include('<pre class="error-message">You don&#x27;t have permission to access this group</pre>');
          done();
        });
      });
    });

  });

});
