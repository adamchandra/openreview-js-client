var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesGuest', function() {

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

  it('should create an invitation for everyone and create a note with a everyone signature and return bad request', function(done) {
    var conference = "conference";
    var reviewer = "reviewer";
    var guestToken = "";
    utils.createGroupP(conference, superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP(reviewer, superUser, superToken, ['everyone'], [user]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': conference + '/-/reviewer-invitation',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'nonreaders': [],
          'invitees': ['everyone'],
          'noninvitees': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'description': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'description'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=' + conference + '/-/reviewer-invitation')
        .set('User-Agent', 'test-create-script')
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      var invitation = result.body.invitations[0];
      invitation.invitees.should.eql(['everyone']);
      invitation.noninvitees.should.eql([]);
      chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + guestToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: conference + '/-/reviewer-invitation',
          signatures: ['~Super_User1'],
          readers: [conference],
          writers: [conference],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
        .end(function(err, result) {
          result.should.have.status(400);
          result.should.be.json;
          result.body.should.be.a('object');
          result.body.should.have.property('name');
          result.body.name.should.equal('error');
          result.body.should.have.property('errors');
          result.body.errors.should.be.a('array');
          result.body.errors.length.should.equal(1);
          result.body.errors[0].type.should.equal('notSignatory');
          result.body.errors[0].path.should.equal('signatures');
          result.body.errors[0].value.should.eql(['~Super_User1']);
          result.body.errors[0].user.should.match(/guest*/);
          done();
        });
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should create an invitation for everyone and create a note with a anonymous signature and return ok', function(done) {
    var conference = "conference2";
    var reviewer = "reviewer2";
    var guestToken = "";
    utils.createGroupP(conference, superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP(reviewer, superUser, superToken, ['everyone'], [user]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': conference + '/-/reviewer-invitation',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'nonreaders': [],
          'invitees': ['everyone'],
          'noninvitees': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'description': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'description'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=' + conference + '/-/reviewer-invitation')
        .set('User-Agent', 'test-create-script')
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      var invitation = result.body.invitations[0];
      invitation.invitees.should.eql(['everyone']);
      invitation.noninvitees.should.eql([]);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + guestToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: conference + '/-/reviewer-invitation',
          signatures: ['(anonymous)'],
          readers: [conference],
          writers: ['(anonymous)'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        invitation: conference + '/-/reviewer-invitation',
        signatures: ['(anonymous)'],
        readers: [conference],
        writers: ['(anonymous)'],
        content: {
          title: 'this is a title',
          description: 'this is a description'
        }
      });
    })
    .then(function(result) {
      result.should.have.status(200);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should create an invitation for everyone and create a note with a guest signature and return ok', function(done) {
    var conference = "conference3";
    var reviewer = "reviewer3";
    var guestToken = "";
    utils.createGroupP(conference, superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP(reviewer, superUser, superToken, ['everyone'], [user]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': conference + '/-/reviewer-invitation',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'nonreaders': [],
          'invitees': ['everyone'],
          'noninvitees': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'description': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'description'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=' + conference + '/-/reviewer-invitation')
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      var invitation = result.body.invitations[0];
      invitation.invitees.should.eql(['everyone']);
      invitation.noninvitees.should.eql([]);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + guestToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: conference + '/-/reviewer-invitation',
          signatures: ['(guest)'],
          readers: [conference],
          writers: ['(guest)'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should create an invitation for everyone, with signatures as reviewer or guest user, create a note with a guest signature and return ok', function(done) {
    var conference = "conference-4";
    var reviewer = "reviewer-4";
    var guestToken = "";
    utils.createGroupP(conference, superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP(reviewer, superUser, superToken, ['everyone'], [user]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': conference + '/-/reviewer-invitation',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'nonreaders': [],
          'invitees': ['everyone'],
          'noninvitees': [],
          'reply' : {
            readers: { 'values': [conference] },
            signatures: { 'values-regex': 'reviewer-.+|\\(anonymous\\)' },
            writers: { 'values-regex': 'reviewer-.+|\\(anonymous\\)' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'description': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'description'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=' + conference + '/-/reviewer-invitation')
        .set('User-Agent', 'test-create-script')
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      var invitation = result.body.invitations[0];
      invitation.invitees.should.eql(['everyone']);
      invitation.noninvitees.should.eql([]);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + guestToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: conference + '/-/reviewer-invitation',
          signatures: ['(anonymous)'],
          readers: [conference],
          writers: ['(anonymous)'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should create an invitation for everyone and create a note with a user signature and return ok', function(done) {
    var conference = "conference-5";
    var reviewer = "reviewer-5";
    utils.createGroupP(conference, superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP(reviewer, superUser, superToken, ['everyone'], [user]);
    })
    .then(function(result) {
      result.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': conference + '/-/reviewer-invitation',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'nonreaders': [],
          'invitees': ['everyone'],
          'noninvitees': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'description': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'description'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=' + conference + '/-/reviewer-invitation')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      var invitation = result.body.invitations[0];
      invitation.invitees.should.eql(['everyone']);
      invitation.noninvitees.should.eql([]);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: conference + '/-/reviewer-invitation',
          signatures: [user],
          readers: [conference],
          writers: [user],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });


});
