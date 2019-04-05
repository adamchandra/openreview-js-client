var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesAuthorship', function () {

  var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var user = 'test@test.com';
  var anotherToken = '';
  var thirdToken = '';
  var noteId = '';
  var userThree = 'third@test.com';

  before(function (done) {
    utils.setUp(function (aSuperToken, aTestToken) {
      superToken = aSuperToken;
      testToken = aTestToken;
      utils.createAndLoginUser('another@test.com', 'First', 'Last')
      .then(function (token) {
        anotherToken = token;
        utils.createAndLoginUser(userThree, 'One', 'Two')
        .then(function (token) {
          thirdToken = token;
          done();
        })
      })
    });
  });

  after(function (done) {
    utils.tearDown(done);
  });

  it('should create a note and see the author of the note', function (done) {
    utils.createGroupP('workshop', superUser, superToken)
    .then(function (result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user, '~First_Last1'], ['~First_Last1']);
    })
    .then(function (result) {
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
        'reply': {
          readers: {'values-regex': '.+'},
          signatures: {'values-regex': '.+'},
          writers: {'values-regex': '.+'},
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
    .then(function (result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
      .get('/invitations?id=workshop/-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
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
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + anotherToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + thirdToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.not.have.property('tauthor');
      return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'reviewer-1',
        readers: ['~One_Two1'],
        signatures: [superUser],
        signatories: ['reviewer-1', superUser],
        writers: [superUser],
        members: ['~First_Last1']
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
      .get('/notes?invitation=workshop/-/submission&details=all')
      .set('Authorization', 'Bearer ' + thirdToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
      .get('/notes?invitation=workshop/-/submission&details=all')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.not.have.property('tauthor');
      done();
    })
    .catch(function (error) {
      done(error);
    })
  });

  it('should get notes by author and see the forum note', function (done) {

    chai.request(server)
    .get('/notes?tauthor=true&details=writable')
    .set('Authorization', 'Bearer ' + anotherToken)
    .set('User-Agent', 'test-create-script')
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      result.body.notes[0].should.have.property('forum');
      result.body.notes[0].id.should.equal(result.body.notes[0].forum);
      result.body.notes[0].details.writable.should.equal(true);
      done();
    })
    .catch(function (error) {
      done(error);
    })
  });

  it('should create a note and update with the superuser, then see the author of the note has not changed', function (done) {
    utils.createGroupP('workshop', superUser, superToken)
    .then(function (result) {
      result.should.have.status(200);
      return utils.createGroupP('reviewer-1', superUser, superToken, [user, '~First_Last1'], ['~First_Last1']);
    })
    .then(function (result) {
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
        'reply': {
          readers: {'values-regex': '.+'},
          signatures: {'values-regex': '.+'},
          writers: {'values-regex': '.*'},
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
    .then(function (result) {
      result.should.have.status(200);
      result.body.should.have.property('id');
      return chai.request(server)
      .get('/invitations?id=workshop/-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
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
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + anotherToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('id');
      noteId = result.body.notes[0].id
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: noteId,
        forum: noteId,
        invitation: 'workshop/-/submission',
        signatures: ['reviewer-1'],
        readers: ['everyone'],
        writers: ['~Super_User1'],
        content: {
          title: 'this is a title',
          description: 'this is a description'
        }
      })
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.forum;
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + anotherToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('writers');
      result.body.notes[0].writers.should.be.a('array');
      result.body.notes[0].writers.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });


  it('should get notes by invitation and author', function (done) {

    chai.request(server)
    .get('/notes?invitation=workshop/-/submission&tauthor=true&details=writable')
    .set('Authorization', 'Bearer ' + anotherToken)
    .set('User-Agent', 'test-create-script')
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(2);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      result.body.notes[0].should.have.property('forum');
      result.body.notes[0].id.should.equal(result.body.notes[0].forum);
      // the sort in the get notes query was removed so make
      // sure the note is only writable if it's the correct note.
      result.body.notes[0].details.writable.should.equal(result.body.notes[0].id !==  noteId);
      result.body.notes[1].should.have.property('tauthor');
      result.body.notes[1].tauthor.should.equal('another@test.com');
      result.body.notes[1].should.have.property('forum');
      result.body.notes[1].id.should.equal(result.body.notes[1].forum);
      result.body.notes[1].details.writable.should.equal(result.body.notes[1].id !==  noteId);
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should get notes by invitation, author and number', function (done) {

    chai.request(server)
    .get('/notes?invitation=workshop/-/submission&tauthor=true&number=2')
    .set('Authorization', 'Bearer ' + anotherToken)
    .set('User-Agent', 'test-create-script')
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      result.body.notes[0].should.have.property('forum');
      result.body.notes[0].id.should.equal(result.body.notes[0].forum);
      result.body.notes[0].number.should.equal(2);
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should get notes by invitation regex and author', function (done) {

    chai.request(server)
    .get('/notes?invitation=workshop/-/.*&tauthor=true&details=writable')
    .set('Authorization', 'Bearer ' + anotherToken)
    .set('User-Agent', 'test-create-script')
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(2);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('another@test.com');
      result.body.notes[0].should.have.property('forum');
      result.body.notes[0].id.should.equal(result.body.notes[0].forum);
      result.body.notes[0].details.writable.should.equal(result.body.notes[0].id !==  noteId);
      result.body.notes[1].should.have.property('tauthor');
      result.body.notes[1].tauthor.should.equal('another@test.com');
      result.body.notes[1].should.have.property('forum');
      result.body.notes[1].id.should.equal(result.body.notes[1].forum);
      result.body.notes[1].details.writable.should.equal(result.body.notes[1].id !==  noteId);
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });
});
