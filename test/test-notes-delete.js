var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesDelete', function () {

  var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var user = 'test@test.com';

  before(function (done) {
    utils.setUp(function (aSuperToken, aTestToken) {
      superToken = aSuperToken;
      testToken = aTestToken;
      done();
    });
  });

  after(function (done) {
    utils.tearDown(done);
  });

  it('should delete a note and its references with the superuser token', function (done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(result) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']});
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      noteId = res.body.id;
      return chai.request(server)
        .delete('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      return chai.request(server)
      .get('/references?referent=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should delete a note with the non superuser token and get an error', function (done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(result) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']});
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      noteId = res.body.id;
      return chai.request(server)
        .delete('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId
        });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('forbidden');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('forbidden');
      res.body.errors[0].path.should.equal('id');
      res.body.errors[0].value.should.equal(noteId);
      res.body.errors[0].user.should.equal(user);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should delete a non existent note and get an error', function (done) {
    chai.request(server)
    .delete('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'kkkk'
    })
    .then(function(res) {
      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('Not Found');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      res.body.errors[0].path.should.equal('id');
      res.body.errors[0].value.should.equal('kkkk');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should delete without a body and get an error', function (done) {
    chai.request(server)
    .delete('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(res) {
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].should.equal('Note id is missing');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should delete a note with a ddate and its references with the superuser token', function (done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(result) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']});
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'ddate': Date.now(),
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      noteId = res.body.id;
      return chai.request(server)
        .delete('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      return chai.request(server)
      .get('/references?referent=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should set a ddate of a note, get the note by id and get an error', function (done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(result) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']});
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      noteId = res.body.id;
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId,
          ddate: Date.now(),
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      res.body.should.have.property('ddate');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(404);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('Not Found');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: noteId,
          ddate: null,
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.have.property('ddate');
      should.equal(res.body.ddate, null);
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.length.should.equals(1);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should get notes by invitation and filter out the deleted notes', function (done) {

    var noteId;
    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'ddate': Date.now(),
      'invitation': 'ICC.cc/-/submission',
      'forum': null,
      'parent': null,
      'signatures': ['~Super_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'content': {
        'title': 'SHOULD SUCCEED 1',
        'review': 'The abstract of test paper 1',
        'rating': '1',
        'confidence': '1'
      }
    })
    .then(function(res) {
      res.should.have.status(200);
      noteId = res.body.id;
      return chai.request(server)
      .get('/notes?invitation=ICC.cc/-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.length.should.equals(2);
      return chai.request(server)
      .get('/notes?invitation=ICC.cc/-/submission&trash=true')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.length.should.equals(3);
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(404);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('Not Found');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

});
