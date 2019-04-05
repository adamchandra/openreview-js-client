var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);



describe('Invitations', function() {

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

  it('water invite test', function(done) {
    utils.createGroupP('rain', superUser, superToken, [superUser, user])
    .then(function(response) {
      response.should.have.status(200);
      // console.log("created rain group", JSON.stringify(response.body, undefined, 2));
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'rain/-/water',
          'signatures': [superUser],
          'writers': [superUser],
          'invitees': [superUser],
          'readers': ['test@test.com', superUser],
          'nonreaders': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {}
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;

      // console.log("post /invitations", JSON.stringify(response.body, undefined, 2));

      response.body.should.be.a('object');
      // make sure we return more than just the id
      response.body.should.have.property('tauthor');
      response.body.should.have.property('id');
      response.body.should.have.property('tcdate');
      response.body.should.have.property('cdate');
      response.body.id.should.equal('rain/-/water');
      return chai.request(server)
        .get('/invitations?id=rain/-/water')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');

      // console.log("get /invitations", JSON.stringify(response.body, undefined, 2));

      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].should.not.have.property('tauthor');
      response.body.invitations[0].should.have.property('signatures');
      response.body.invitations[0].signatures.should.eql([superUser]);
      response.body.invitations[0].should.have.property('writers');
      response.body.invitations[0].writers.should.eql([superUser]);
      response.body.invitations[0].should.have.property('invitees');
      response.body.invitations[0].invitees.should.eql([superUser]);
      response.body.invitations[0].should.not.have.property('noninvitees');
      response.body.invitations[0].should.have.property('readers');
      response.body.invitations[0].readers.should.eql(['test@test.com', superUser]);
      response.body.invitations[0].should.have.property('nonreaders');
      response.body.invitations[0].nonreaders.should.eql([]);
      return chai.request(server)
        .get('/invitations?id=rain/-/water')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].should.have.property('tauthor');
      response.body.invitations[0].tauthor.should.equal(superUser);
      done();
    })
    .catch(done);

  });

  it('fire invite test', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': "rain/-/fire",
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com', superUser],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      })
      .end(function(err, res) {

        console.log("post /invitations", JSON.stringify(res.body, undefined, 2));
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('rain/-/fire');
        done();
      });
  });

  it('should list ALL invitations on /invitations for test token', function(done) {
    chai.request(server)
      .get('/invitations')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {

        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('invitations');
        res.body.invitations.should.be.a('array');
        res.body.invitations.length.should.equal(2);
        res.body.invitations[0].should.have.property('id');
        res.body.invitations[0].should.have.property('signatures');
        res.body.invitations[0].should.have.property('readers');
        res.body.invitations[0].should.have.property('writers');
        done();
      });
  });

  it('should list a SINGLE invitation on /invitations for test token', function(done) {
    chai.request(server)
      .get('/invitations?id=rain/-/fire')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('invitations');
        res.body.invitations.should.be.a('array');
        res.body.invitations.length.should.not.equal(0);
        res.body.invitations[0].should.have.property('id');
        res.body.invitations[0].should.have.property('signatures');
        res.body.invitations[0].should.have.property('readers');
        res.body.invitations[0].should.have.property('writers');
        done();
      });
  });

  it('should get a forbidden when list another SINGLE invitation on /invitations for test token', function(done) {
    utils.createGroupP('rain', superUser, superToken, [superUser, user])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'rain/-/water',
          'signatures': [superUser],
          'writers': [superUser],
          'invitees': [superUser],
          'readers': ['test@test.com'],
          'nonreaders': ['test@test.com'],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {}
          }
        });
    })
    .then(function(response) {
      chai.request(server)
      .get('/invitations?id=rain/-/water')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('forbidden');
        response.body.message.should.equal('Forbidden');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].type.should.equal('forbidden');
        response.body.errors[0].path.should.equal('id');
        response.body.errors[0].value.should.equal('rain/-/water');
        response.body.errors[0].user.should.equal(user);
        done();
      });
    })
    .catch(done);
  });

  it('fire invite test non reader', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': "rain/-/fire",
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com', superUser],
        'nonreaders': ['test@test.com'],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('rain/-/fire');
        done();
      });
  });

  it('should get an empty response when list ALL invitations on /invitations for test token', function(done) {
    chai.request(server)
      .get('/invitations')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('invitations');
        res.body.invitations.should.be.a('array');
        res.body.invitations.length.should.equal(0);
        done();
      });
  });

  it('should get a forbidden when list a SINGLE invitation on /invitations for test token', function(done) {
    chai.request(server)
      .get('/invitations?id=rain/-/fire')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.should.have.property('name');
        response.body.name.should.equal('forbidden');
        response.body.message.should.equal('Forbidden');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].type.should.equal('forbidden');
        response.body.errors[0].path.should.equal('id');
        response.body.errors[0].value.should.equal('rain/-/fire');
        response.body.errors[0].user.should.equal(user);
        done();
      });
  });

  it('create an invitation with nonreaders reply', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': "rain/-/fire",
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com', superUser],
        'nonreaders': ['test@test.com'],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          nonreaders: { 'values-regex': '~.*' },
          content: {}
        }
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('rain/-/fire');
        done();
      });
  });

  it('should get a 400 error when attempting to get an invitation by id which does not exist', function(done) {
    chai.request(server)
      .get('/invitations?id=asdfasdfasdfrandomnonsense')
      .set('Authorization','Bearer '+superToken)
      .set('User-Agent','test-create-script')
      .end(function(err, response){
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Invitation Not Found: asdfasdfasdfrandomnonsense');
        done();
      })
  })

  it('should get a forbidden error where the user is part of the nonreaders domain', function(done) {
    utils.createGroup('rain2', superUser, superToken, [superUser, user], function() {
      chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'rain2/-/water',
          'signatures': [superUser],
          'writers': [superUser],
          'invitees': [superUser],
          'readers': ['test@test.com'],
          'nonreaders': ['test.com'],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {}
          }
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.equal('rain2/-/water');
          chai.request(server)
            .get('/invitations?id=rain2/-/water')
            .set('Authorization', 'Bearer ' + testToken)
            .set('User-Agent', 'test-create-script')
            .end(function(err, response) {
              response.should.have.status(400);
              response.should.be.json;
              response.body.should.be.a('object');
              response.body.should.have.property('name');
              response.body.should.have.property('name');
              response.body.name.should.equal('forbidden');
              response.body.message.should.equal('Forbidden');
              response.body.should.have.property('errors');
              response.body.errors.should.be.a('array');
              response.body.errors.length.should.equal(1);
              response.body.errors[0].type.should.equal('forbidden');
              response.body.errors[0].path.should.equal('id');
              response.body.errors[0].value.should.equal('rain2/-/water');
              response.body.errors[0].user.should.equal(user);
              done();
            });
        });
    });
  });

  it('should post an empty invitation and get an error', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({})
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('Not Found');
        res.body.errors[0].path.should.equal('id');
        done();
      });
  });

  it('create an invitation, update it with a no writer user and get a forbidden error', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': "rain/-/fire2",
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com', superUser],
        'nonreaders': ['test@test.com'],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          nonreaders: { 'values-regex': '~.*' },
          content: {}
        }
      })
      .end(function(err, response) {
        utils.assertIdResponse(response);
        chai.request(server)
          .post('/invitations')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'id': "rain/-/fire2",
            'signatures': [superUser],
            'writers': [superUser],
            'invitees': [superUser],
            'readers': ['test@test.com', superUser],
            'nonreaders': ['test@test.com'],
            'reply' : {
              readers: { 'values-regex': '.+' },
              signatures: { 'values-regex': '.+' },
              writers: { 'values-regex': '.+' },
              content: {}
            }
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
            res.body.errors[0].type.should.equal('forbidden');
            res.body.errors[0].path.should.equal('id');
            res.body.errors[0].value.should.equal('rain/-/fire2');
            res.body.errors[0].user.should.eql('test@test.com');
            done();
          });
      });
  });

  it('should get a notSignatory error where the user uses a not signatory prefix group name for the invitation', function(done) {
    utils.createGroup('rain3', superUser, superToken, [user], function() {
      chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'rain3/-/water',
          'signatures': [superUser],
          'writers': [user],
          'invitees': ['everyone'],
          'readers': ['test@test.com'],
          'nonreaders': ['test.com'],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {}
          }
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
          res.body.errors[0].type.should.equal('notSignatory');
          res.body.errors[0].path.should.equal('id prefix');
          res.body.errors[0].value.should.equal('rain3');
          res.body.errors[0].user.should.eql('test@test.com');
          done();
        });
    });

  });

  it('should get a notSignatory error where the user signs an invitation as superUser', function(done) {
    utils.createGroupP('rain4', superUser, superToken, [user], [user], ['rain4', user, superUser])
    .then(function(response) {
      chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'rain4/-/water',
          'signatures': [superUser],
          'writers': [user],
          'invitees': ['everyone'],
          'readers': ['test@test.com'],
          'nonreaders': ['test.com'],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {}
          }
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
          res.body.errors[0].type.should.equal('notSignatory');
          res.body.errors[0].path.should.equal('signatures');
          res.body.errors[0].value.should.eql([superUser]);
          res.body.errors[0].user.should.eql('test@test.com');
          done();
        });
    })
    .catch(done);
  });

  it('should get an invitation with a non superUser signatory', function(done) {
    chai.request(server)
    .post('/groups')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'rain5',
      'signatures': [user],
      'writers': [user],
      'readers': ['everyone'],
      'members': [user],
      'signatories': ['rain5', user]
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'pc',
          'signatures': [user],
          'writers': [user],
          'readers': ['everyone'],
          'members': [user],
          'signatories': ['pc', user]
        })
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'rain5/-/water',
          'signatures': ['pc'],
          'writers': [user],
          'invitees': ['everyone'],
          'readers': ['everyone'],
          'nonreaders': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {}
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      done();
    })
    .catch(done);
  });

  it('should create an invitation with an invalid prefix and get an error', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'rain6/-/water',
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com'],
        'nonreaders': ['test@test.com'],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
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
        res.body.errors[0].type.should.equal('Not Found');
        res.body.errors[0].path.should.equal('id prefix');
        res.body.errors[0].value.should.equal('rain6');
        done();
      });
  })

  it('should create an invitation with due date and get an ok', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'rain/-/water2',
        'duedate': 1502906306000,
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com'],
        'nonreaders': [],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      })
      .end(function(err, res) {
        utils.assertIdResponse(res);
        chai.request(server)
          .get('/invitations?id=rain/-/water2')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('invitations');
            res.body.invitations.should.be.a('array');
            res.body.invitations.length.should.not.equal(0);
            res.body.invitations[0].should.have.property('id');
            res.body.invitations[0].should.have.property('duedate');
            res.body.invitations[0].duedate.should.equal(1502906306000);
            done();
          })
      });
  })

  it('should edit an invitation with no writer permission and get an error', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'rain/-/water2',
        'duedate': 1502906306000,
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com'],
        'nonreaders': [],
        'reply' : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      })
      .end(function(err, res) {
        utils.assertIdResponse(res);
        chai.request(server)
          .post('/invitations')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'id': 'rain/-/water2',
            'duedate': 1502906306000,
            'signatures': [superUser],
            'writers': [superUser],
            'invitees': [superUser],
            'readers': ['test@test.com'],
            'nonreaders': [],
            'reply' : {
              readers: { 'values-regex': '.+' },
              signatures: { 'values-regex': '.+' },
              writers: { 'values-regex': '.+' },
              content: {}
            }
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
            res.body.errors[0].type.should.equal('forbidden');
            res.body.errors[0].path.should.equal('id');
            res.body.errors[0].value.should.equal('rain/-/water2');
            res.body.errors[0].user.should.equal('test@test.com');
            done();
          });
      });
  });

  it('should create an invitation with referenti and get an ok', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'rain/-/waterwithreferenti',
        'signatures': [superUser],
        'writers': [superUser],
        'invitees': [superUser],
        'readers': ['test@test.com'],
        'nonreaders': [],
        'reply' : {
          referenti: ['rain/-/water'],
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      })
      .end(function(err, res) {
        utils.assertIdResponse(res);
        chai.request(server)
          .get('/invitations?id=rain/-/waterwithreferenti')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('invitations');
            res.body.invitations.should.be.a('array');
            res.body.invitations.length.should.not.equal(0);
            res.body.invitations[0].should.have.property('id');
            res.body.invitations[0].reply.referenti.should.eql(['rain/-/water']);
            done();
          });
      });
  });

  // Invitation Controller Tests
  it('should return invitation page HTML including webfield code', function(done) {
    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'rain/-/water',
      signatures: [superUser],
      writers: [superUser],
      invitees: [superUser],
      readers: ['test@test.com', superUser],
      nonreaders: [],
      reply : {
        readers: { 'values-regex': '.+' },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        content: {}
      },
      web: 'console.log("this is webfield js code");'
    })
    .end(function() {
      chai.request(server)
      .get('/invitation?id=rain/-/water')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script-html')
      .end(function(error, res) {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.include('console.log("this is webfield js code");');
        done();
      });
    });
  });

  it('should return invitation page HTML and properly parse legacy webfield code', function(done) {
    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'rain/-/water2',
      signatures: [superUser],
      writers: [superUser],
      invitees: [superUser],
      readers: ['test@test.com', superUser],
      nonreaders: [],
      reply : {
        readers: { 'values-regex': '.+' },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        content: {}
      },
      web: '<body><h1>Title</h1><script type="text/javascript">console.log("this is webfield js code");</script></body>'
    })
    .end(function() {
      chai.request(server)
      .get('/invitation?id=rain/-/water2')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script-html')
      .end(function(error, res) {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.include('$(\'#invitation-container\').append(\'<h1>Title</h1>\');');
        res.text.should.include('console.log("this is webfield js code");');
        done();
      });
    });
  });

  it('should try to access a non-existant group page and get a 404 page', function(done) {
    chai.request(server)
    .get('/invitation?id=rain/-/zzzz')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script-html')
    .end(function(error, res) {
      res.should.have.status(404);
      res.should.be.html;
      res.text.should.include('<pre class="error-message">Invitation not found</pre>');
      done();
    });
  });

  it('should try to access a group page without the right permissions and get redirected to the login page', function(done) {
    chai.request(server)
    .get('/invitation?id=rain/-/water')
    .set('User-Agent', 'test-create-script-html')
    .end(function(error, res) {
      res.should.have.status(200);
      res.should.be.html;
      res.text.should.include('<title>Login | OpenReview</title>');
      done();
    });
  });

  it('should create an invitation with a cdate in the future and get an ok', function(done) {
    var cdate = Date.now() + 50000;
    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'rain/-/water3',
      cdate: cdate,
      signatures: [superUser],
      writers: [superUser],
      invitees: [],
      readers: ['test@test.com'],
      nonreaders: [],
      reply : {
        readers: { 'values-regex': '.+' },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        content: {}
      }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.cdate.should.equal(cdate);
      return chai.request(server)
      .get('/invitations?regex=rain/-/water3')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script-html');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('invitations');
      res.body.invitations.should.be.a('array');
      res.body.invitations.length.should.equal(0);
      return chai.request(server)
      .get('/invitations?regex=rain/-/water3')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script-html');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('invitations');
      res.body.invitations.should.be.a('array');
      res.body.invitations.length.should.equal(1);
      res.body.invitations[0].cdate.should.be.above(Date.now());
      return chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'rain/-/water3',
        cdate: cdate,
        signatures: [superUser],
        writers: [superUser],
        invitees: [],
        readers: ['test@test.com'],
        nonreaders: [],
        reply : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.cdate.should.equal(cdate);
      return chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'rain/-/water3',
        signatures: [superUser],
        writers: [superUser],
        invitees: [],
        readers: ['test@test.com'],
        nonreaders: [],
        reply : {
          readers: { 'values-regex': '.+' },
          signatures: { 'values-regex': '.+' },
          writers: { 'values-regex': '.+' },
          content: {}
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.cdate.should.equal(cdate);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

});
