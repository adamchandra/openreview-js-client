
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('InvitationGet', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  var anotherToken = "";
  var thirdToken = "";
  var noteId = "";

  before(function(done) {
    utils.setUp(function(aSuperToken, aTestToken){
      superToken = aSuperToken;
      testToken = aTestToken;
      utils.createAndLoginUser('another@test.com', "First", "Last")
      .then(function(token) {
        anotherToken = token;
        utils.createAndLoginUser('third@test.com', "One", "Two")
        .then(function(token) {
          thirdToken = token;
          done();
        })
      })
    });
  });

  after(function(done) {
    utils.tearDown(done);
  });

  /*it('should get invitations by non existent replyForum and get an error', function(done) {
  	chai.request(server)
    .get('/invitations?replyForum=22222')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
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
      res.body.errors[0].path.should.equal('replyForum');
      res.body.errors[0].should.have.property('value');
      res.body.errors[0].value.should.equal('22222');
      done();
    });
  });*/

  it('should get invitations by replyForum', function(done) {

    utils.createGroupP('workshop', superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user], ["~First_Last1"]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/submission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
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
        .get('/invitations?id=workshop/-/submission')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/comment',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
          'reply' : {
          	forum: noteId,
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'comment': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'comment'
              },
            }
          },
          'process': 'function() { console.log("process function!!!!!"); return true;}'
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/invitations?replyForum=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop/-/comment');
      result.body.invitations[0].reply.forum.should.equal(noteId);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations with special invitee by replyForum using superUser', function(done) {

    utils.createGroupP('workshop', superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user], ["~First_Last1"]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/submission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
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
    .then(function(result){
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=workshop/-/submission')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/comment',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['reviewer-1'],
          'reply' : {
            forum: noteId,
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'comment': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'comment'
              },
            }
          },
          'process': 'function() { console.log("process function!!!!!"); return true;}'
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/invitations?replyForum=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop/-/comment');
      result.body.invitations[0].reply.forum.should.equal(noteId);
      return chai.request(server)
        .get('/invitations?replyForum=' + noteId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations by replyInvitation and get a valid result', function(done) {

    utils.createGroupP('workshop', superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user], ["~First_Last1"]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/submission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            invitation: 'workshop/-/Add/Tag',
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
          },
          'process': 'function() { console.log("process function!!!!!"); return true;}'
        });
    })
    .then(function(result){
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=workshop/-/submission')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/invitations?replyInvitation=workshop/-/Add/Tag')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop/-/submission');
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations by replyInvitation and get an empty result', function(done) {

    chai.request(server)
    .get('/invitations?replyInvitation=workshop2/-/Add/Tag')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations by regex and get an empty result', function(done) {

    chai.request(server)
    .get('/invitations?regex=auai.org/UAI/2017/-/Paper.*/Open/Comment')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations by regex and get a non empty result', function(done) {

    chai.request(server)
    .get('/invitations?regex=workshop/-/.*')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(2);
      result.body.invitations[0].id.should.equal('workshop/-/comment');
      result.body.invitations[1].id.should.equal('workshop/-/submission');
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations by another regex and get a non empty result', function(done) {

    chai.request(server)
    .get('/invitations?regex=work.*/-/comment')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop/-/comment');
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get invitations by replyInvitation and replyForum with different reply properties: invitation and forum', function(done) {

    utils.createGroupP('workshop', superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user], ["~First_Last1"]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/submission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
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
    .then(function(result){
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=workshop/-/submission')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/comment',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
          'reply' : {
            forum: noteId,
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'comment': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'comment'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/Add/Tag',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            invitation: 'workshop/-/submission',
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
      result.should.be.json;
      return chai.request(server)
        .get('/invitations?replyInvitation=workshop/-/submission')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop/-/Add/Tag');
      result.body.invitations[0].reply.invitation.should.equal('workshop/-/submission');
      return chai.request(server)
        .get('/invitations?replyForum=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(2);
      result.body.invitations[0].id.should.equal('workshop/-/Add/Tag');
      result.body.invitations[0].reply.invitation.should.equal('workshop/-/submission');
      result.body.invitations[1].id.should.equal('workshop/-/comment');
      result.body.invitations[1].reply.forum.should.equal(noteId);
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get notes with invitations pending to reply where the logged user is invitee', function(done) {

    utils.createGroupP('workshop', superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user], ["~First_Last1"]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/submission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
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
    .then(function(result){
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
        .get('/invitations?id=workshop/-/submission')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/review',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': [user],
          'duedate': Date.now(),
          'reply' : {
            replyto: noteId,
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'comment': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'comment'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/notes?invitee=true&duedate=true')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('replytoNote');
      result.body.notes[0].should.have.property('invitation');
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });


  it('should get invitations by limit and offset and get a non empty result', function(done) {

    chai.request(server)
    .get('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(5);
      return chai.request(server)
      .get('/invitations?limit=2')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(2);
      return chai.request(server)
      .get('/invitations?limit=2&offset=4')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });


  it('should get invitations by invitee different than the logged user', function(done) {

    chai.request(server)
    .get('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(5);
      return chai.request(server)
      .get('/invitations?invitee=~')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(4);
      result.body.invitations[0].invitees.should.eql(['everyone']);
      result.body.invitations[1].invitees.should.eql(['everyone']);
      result.body.invitations[2].invitees.should.eql(['everyone']);
      result.body.invitations[3].invitees.should.eql(['~']);
      return chai.request(server)
      .get('/invitations?invitee=' + user)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(5);
      result.body.invitations[0].invitees.should.eql([user]);
      result.body.invitations[1].invitees.should.eql(['everyone']);
      result.body.invitations[2].invitees.should.eql(['everyone']);
      result.body.invitations[3].invitees.should.eql(['everyone']);
      result.body.invitations[4].invitees.should.eql(['~']);
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

/* disable temporary this test, I think we don't need to get invitations by invitation of the the reply forum
  it('should get invitations by replyForum and references invitations', function(done) {
    var forumId;
    utils.createGroupP('workshop2', superUser, superToken)
    .then(function(result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user], ["~First_Last1"]);
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop2/-/submission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
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
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop2/-/upload',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
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
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('id');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop2/-/commentUpload',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
          'reply' : {
            invitation: 'workshop2/-/upload',
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'comment': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'comment'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('id');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop2/-/commentSubmission',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'invitees': ['everyone'],
          'reply' : {
            invitation: 'workshop2/-/submission',
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              'title': {
                'order': 1,
                'value-regex': '.{0,50}',
                'description': 'title'
              },
              'comment': {
                'order': 2,
                'value-regex': '.{0,50}',
                'description': 'comment'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('id');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop2/-/submission',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('id');
      forumId = result.body.id;
      return chai.request(server)
        .get('/invitations?replyForum=' + forumId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop2/-/commentSubmission');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + anotherToken)
        .set('User-Agent', 'test-create-script')
        .send({
          referent: forumId,
          invitation: 'workshop2/-/upload',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/invitations?replyForum=' + forumId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(2);
      result.body.invitations[0].id.should.equal('workshop2/-/commentSubmission');
      result.body.invitations[1].id.should.equal('workshop2/-/commentUpload');
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });
*/
});
