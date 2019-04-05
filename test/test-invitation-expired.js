var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);



describe('InvitationExpired', function() {

  var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var user = 'test@test.com';

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

  it('create an invitation with expiration date', function(done) {
    utils.createGroupP('rain', superUser, superToken, [superUser, user])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'rain/-/water',
          expdate: Date.now() + 50000,
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
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('tauthor');
      response.body.should.have.property('id');
      response.body.id.should.equal('rain/-/water');
      response.body.should.have.property('expdate');
      return chai.request(server)
        .get('/invitations?id=rain/-/water')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
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
      response.body.invitations[0].should.have.property('expdate');
      done();
    })
    .catch(done);

  });


  it('create an expired invitation and filter the result', function(done) {
    utils.createGroupP('rain', superUser, superToken, [superUser, user])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'rain/-/water',
          expdate: Date.now() - 50000,
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
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('tauthor');
      response.body.should.have.property('id');
      response.body.id.should.equal('rain/-/water');
      response.body.should.have.property('expdate');
      return chai.request(server)
        .get('/invitations')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(0);
      return chai.request(server)
        .get('/invitations?expired=true')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(1);
      return chai.request(server)
        .get('/invitations?expired=false')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(0);
      return chai.request(server)
        .get('/invitations?id=rain/-/water')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(404);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('Not Found');
      response.body.should.have.property('errors');
      response.body.errors.should.be.a('array');
      response.body.errors.length.should.equal(1);
      response.body.errors[0].type.should.equal('Not Found');
      response.body.errors[0].path.should.equal('invitation');
      response.body.errors[0].value.should.equal('rain/-/water')
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
      done();
    })
    .catch(done);

  });

  it('create an expired invitation, create a note and get an error', function(done) {
    utils.createGroupP('rain', superUser, superToken, [superUser, user])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'rain/-/water',
          expdate: Date.now() - 50000,
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
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('tauthor');
      response.body.should.have.property('id');
      response.body.id.should.equal('rain/-/water');
      response.body.should.have.property('expdate');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'rain/-/water',
          signatures: [user],
          writers: [user],
          readers: ['test@test.com', superUser],
          nonreaders: [],
          content : {
          }
        });
    })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('error');
      response.body.should.have.property('errors');
      response.body.errors.should.be.a('array');
      response.body.errors.length.should.equal(1);
      response.body.errors[0].type.should.equal('Not Found');
      response.body.errors[0].path.should.equal('invitation');
      response.body.errors[0].value.should.equal('rain/-/water');
      done();
    })
    .catch(done);

  });

  it('create an invitation, create a note, expire the invitation, edit a note and get an error', function(done) {
    var noteId;
    utils.createGroupP('rain', superUser, superToken, [superUser, user])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
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
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('tauthor');
      response.body.should.have.property('id');
      response.body.id.should.equal('rain/-/water');
      response.body.should.not.have.property('expdate');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'rain/-/water',
          signatures: [user],
          writers: [user],
          readers: ['test@test.com', superUser],
          nonreaders: [],
          content : {
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      noteId = response.body.id;
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'rain/-/water',
          expdate: Date.now() - 50000,
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
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('tauthor');
      response.body.should.have.property('id');
      response.body.id.should.equal('rain/-/water');
      response.body.should.have.property('expdate');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId,
          invitation: 'rain/-/water',
          signatures: [user],
          writers: [user],
          readers: ['test@test.com', superUser],
          nonreaders: [],
          content : {
            title: 'this is a title'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('error');
      response.body.should.have.property('errors');
      response.body.errors.should.be.a('array');
      response.body.errors.length.should.equal(1);
      response.body.errors[0].type.should.equal('Not Found');
      response.body.errors[0].path.should.equal('invitation');
      response.body.errors[0].value.should.equal('rain/-/water');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId,
          invitation: 'rain/-/water',
          signatures: [user],
          writers: [user],
          readers: ['test@test.com', superUser],
          nonreaders: [],
          content : {
            title: 'this is a title'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.title.should.equal('this is a title');
      return chai.request(server)
        .get('/notes?forum=' + noteId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.notes.length.should.equal(1);
      response.body.notes[0].id.should.equal(noteId);
      response.body.notes[0].details.writable.should.equal(false);
      done();
    })
    .catch(done);

  });

});
