var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesOriginal', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  var noteId;
  var overwrittenId;
  var secondOverwrittenId;

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


  it('should create a note with an original link to an existing note', function(done) {

    var tcdate;
    var tmdate;

    utils.createGroupP('abc.com', superUser, superToken, ['everyone'])
    .then(function(res){
      return utils.createInvitationP('abc.com/-/submission', 'abc.com', superToken, {
        A: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        B: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        C: {
          order: 3,
          'value-regex': '.{0,100}',
          required: false
        }
      }, { values: ['abc.com'] })
    })
    .then(function(res) {
      return utils.createInvitationP('abc.com/-/original', 'abc.com', superToken, {
        B: {
          order: 1,
          'value-regex': '.{0,100}',
        },
        D: {
          order: 2,
          'value-regex': '.{1,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(res) {
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['abc.com'],
        'content': {
          'A': 'foo',
          'B': '2',
          'C': '3'
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
        'invitation': 'abc.com/-/original',
        'original': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': '5',
          'D': '7'
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
      overwrittenId = res.body.id;
      return chai.request(server)
        .get('/notes?id=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('foo');
      res.body.notes[0].content.B.should.equal('5');
      res.body.notes[0].content.C.should.equal('3');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      tcdate = res.body.notes[0].tcdate;
      tmdate = res.body.notes[0].tmdate;
      tcdate.should.equal(tmdate);
      return chai.request(server)
        .get('/references?referent=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(1);
      res.body.references[0].invitation.should.equal('abc.com/-/original');
      res.body.references[0].content.should.not.have.property('A');
      res.body.references[0].content.B.should.equal('5');
      res.body.references[0].content.should.not.have.property('C');
      res.body.references[0].content.D.should.equal('7');
      res.body.references[0].original.should.equal(noteId);
      res.body.references[0].referent.should.equal(overwrittenId);
      res.body.references[0].tcdate.should.equal(tcdate);
      res.body.references[0].tmdate.should.equal(tmdate);
      return chai.request(server)
        .get('/notes?invitation=abc.com/-/original&details=all')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].original.should.equal(noteId);
      res.body.notes[0].details.original.id.should.equal(noteId);
      return chai.request(server)
        .get('/notes?invitation=abc.com/-/original&details=all')
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].original.should.equal(noteId);
      res.body.notes[0].details.should.not.have.property('original');
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });


  it('should create a new revision of an overwriting note and get the inference correctly', function(done) {

    utils.createInvitationP('abc.com/-/ref', 'abc.com', superToken, {
        B: {
          order: 1,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': overwrittenId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': '6'
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
      var refId = res.body.id;
      return chai.request(server)
        .get('/notes?id=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('foo');
      res.body.notes[0].content.B.should.equal('6');
      res.body.notes[0].content.C.should.equal('3');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should update an overwriting note and get the inference ok', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': overwrittenId,
        'invitation': 'abc.com/-/original',
        'original': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': '8',
          'D': '7',
          'C': '4'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      var refId = res.body.id;
      return chai.request(server)
        .get('/notes?id=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('foo');
      res.body.notes[0].content.B.should.equal('8');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .get('/references?referent=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(2);
      res.body.references[0].invitation.should.equal('abc.com/-/original');
      res.body.references[0].content.should.not.have.property('A');
      res.body.references[0].content.B.should.equal('8');
      res.body.references[0].content.C.should.equal('4');
      res.body.references[0].content.D.should.equal('7');
      res.body.references[0].original.should.equal(noteId);
      res.body.references[0].referent.should.equal(overwrittenId);
      var tcdate = res.body.references[0].tcdate;
      var tmdate = res.body.references[0].tmdate;
      tcdate.should.not.equal(tmdate);
      res.body.references[1].invitation.should.equal('abc.com/-/ref');
      res.body.references[1].content.should.not.have.property('A');
      res.body.references[1].content.B.should.equal('6');
      res.body.references[1].content.should.not.have.property('C');
      res.body.references[1].content.should.not.have.property('D');
      res.body.references[1].referent.should.equal(overwrittenId);
      var tcdate = res.body.references[1].tcdate;
      var tmdate = res.body.references[1].tmdate;
      tcdate.should.equal(tmdate);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should update an overwriting note removing an original field and get back the original value', function(done) {

    var anonId;
    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/original',
        'original': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': 'Anonymous',
          'D': '7'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.invitation.should.equal('abc.com/-/original');
      res.body.content.A.should.equal('foo');
      res.body.content.B.should.equal('Anonymous');
      res.body.content.C.should.equal('3');
      res.body.content.D.should.equal('7');
      res.body.original.should.equal(noteId);
      var tcdate = res.body.tcdate;
      var tmdate = res.body.tmdate;
      tcdate.should.equal(tmdate);
      anonId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': anonId,
        'invitation': 'abc.com/-/original',
        'original': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'D': '7'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.invitation.should.equal('abc.com/-/original');
      res.body.content.A.should.equal('foo');
      res.body.content.B.should.equal('2');
      res.body.content.C.should.equal('3');
      res.body.content.D.should.equal('7');
      res.body.original.should.equal(noteId);
      var tcdate = res.body.tcdate;
      var tmdate = res.body.tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': anonId,
          'invitation': 'abc.com/-/original',
          'original': noteId,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'B': 'Anonymous',
            'D': '7'
          }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.invitation.should.equal('abc.com/-/original');
      res.body.content.A.should.equal('foo');
      res.body.content.B.should.equal('Anonymous');
      res.body.content.C.should.equal('3');
      res.body.content.D.should.equal('7');
      res.body.original.should.equal(noteId);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });



  it('should update an original note and get the overwriting note inferred ok', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': noteId,
        'invitation': 'abc.com/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['abc.com'],
        'content': {
          'A': 'bar',
          'B': '2',
          'C': '3'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/submission');
      res.body.notes[0].content.A.should.equal('bar');
      res.body.notes[0].content.B.should.equal('2');
      res.body.notes[0].content.C.should.equal('3');
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .get('/notes?id=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('bar');
      res.body.notes[0].content.B.should.equal('8');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .get('/notes/search?term=bar&group=abc.com')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].content.A.should.equal('bar');
      res.body.notes[1].content.A.should.equal('bar');
      res.body.notes[2].content.A.should.equal('bar');

      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should create a reference of the original note and get the overwriting note inferred ok', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'referent': noteId,
        'invitation': 'abc.com/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['abc.com'],
        'content': {
          'A': 'zoo',
          'B': '20'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/submission');
      res.body.notes[0].content.A.should.equal('zoo');
      res.body.notes[0].content.B.should.equal('20');
      res.body.notes[0].content.C.should.equal('3');
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .get('/notes?id=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('zoo');
      res.body.notes[0].content.B.should.equal('8');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should create a second overwriting note and get the inferred note ok', function(done) {

    utils.createInvitationP('abc.com/-/second-original', 'abc.com', superToken, {
      B: {
        order: 1,
        'value-regex': '.{0,100}',
      }
    }, { values: ['everyone'] })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'original': overwrittenId,
        'invitation': 'abc.com/-/second-original',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': '9'
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
      secondOverwrittenId = res.body.id;
      return chai.request(server)
        .get('/notes?id=' + secondOverwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/second-original');
      res.body.notes[0].content.A.should.equal('zoo');
      res.body.notes[0].content.B.should.equal('9');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(overwrittenId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.equal(tmdate);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });


  it('should update an original note and get the second overwriting note inferred ok', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': noteId,
        'invitation': 'abc.com/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['abc.com'],
        'content': {
          'A': 'mee',
          'B': '2',
          'C': '3'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/submission');
      res.body.notes[0].content.A.should.equal('mee');
      res.body.notes[0].content.B.should.equal('2');
      res.body.notes[0].content.C.should.equal('3');
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .get('/notes?id=' + secondOverwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/second-original');
      res.body.notes[0].content.A.should.equal('mee');
      res.body.notes[0].content.B.should.equal('9');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(overwrittenId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
        .get('/notes?id=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('mee');
      res.body.notes[0].content.B.should.equal('8');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      var tcdate = res.body.notes[0].tcdate;
      var tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('try to create an overwriting note with an invalid original id and get an error', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'original': 'sssddd',
        'invitation': 'abc.com/-/original',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'A': 'mee',
          'B': '2',
          'C': '3'
        }
    }).end(function(err, res) {
      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      res.body.errors[0].path.should.equal('id');
      res.body.errors[0].value.should.equal('sssddd');
      done();
    });

  });

  it('should update an overwriting note with no readers permission and get the note by forum', function(done) {

    var overritingId;
    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/original',
        'original': noteId,
        'signatures': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': '8',
          'D': '7',
          'C': '4'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      overritingId = res.body.id;
      return chai.request(server)
        .get('/notes?forum=' + overritingId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('mee');
      res.body.notes[0].content.B.should.equal('8');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].details.should.not.have.property('original');
      return chai.request(server)
        .get('/notes?forum=' + overritingId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('mee');
      res.body.notes[0].content.B.should.equal('8');
      res.body.notes[0].content.C.should.equal('4');
      res.body.notes[0].content.D.should.equal('7');
      res.body.notes[0].original.should.equal(noteId);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should get the overwriting note with revisions value true', function(done) {

    var id;
    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/original',
        'original': noteId,
        'signatures': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'B': 'bb',
          'D': 'dd',
          'C': 'cc'
        }
    })
    .then(function(res) {
      res.should.have.status(200);
      id = res.body.id;
      return chai.request(server)
        .get('/notes?forum=' + id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('abc.com/-/original');
      res.body.notes[0].content.A.should.equal('mee');
      res.body.notes[0].content.B.should.equal('bb');
      res.body.notes[0].content.C.should.equal('cc');
      res.body.notes[0].content.D.should.equal('dd');
      res.body.notes[0].details.should.have.property('original');
      res.body.notes[0].details.should.have.property('revisions');
      res.body.notes[0].details.revisions.should.equal(true);
      return chai.request(server)
        .get('/references?original=true&referent=' + id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(2);
      res.body.references[0].invitation.should.equal('abc.com/-/original');
      res.body.references[0].content.A.should.equal('mee');
      res.body.references[0].content.B.should.equal('bb');
      res.body.references[0].content.C.should.equal('cc');
      res.body.references[0].content.D.should.equal('dd');
      res.body.references[0].referent.should.equal(id);
      res.body.references[1].invitation.should.equal('abc.com/-/original');
      res.body.references[1].content.A.should.equal('zoo');
      res.body.references[1].content.B.should.equal('bb');
      res.body.references[1].content.C.should.equal('cc');
      res.body.references[1].content.D.should.equal('dd');
      res.body.references[1].referent.should.equal(id);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'referent': id,
          'invitation': 'abc.com/-/original',
          'original': noteId,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'B': 'bb',
            'D': 'dd',
            'C': '88',
            'E': '33'
          }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.invitation.should.equal('abc.com/-/original');
      res.body.content.B.should.equal('bb');
      res.body.content.C.should.equal('88');
      res.body.content.D.should.equal('dd');
      return chai.request(server)
        .get('/references?original=true&referent=' + id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(2);
      res.body.references[0].invitation.should.equal('abc.com/-/original');
      res.body.references[0].content.should.not.have.property('A');
      res.body.references[0].content.B.should.equal('bb');
      res.body.references[0].content.C.should.equal('88');
      res.body.references[0].content.D.should.equal('dd');
      res.body.references[0].content.E.should.equal('33');
      res.body.references[0].referent.should.equal(id);
      res.body.references[1].invitation.should.equal('abc.com/-/original');
      res.body.references[1].content.should.not.have.property('A');
      res.body.references[1].content.B.should.equal('bb');
      res.body.references[1].content.C.should.equal('cc');
      res.body.references[1].content.D.should.equal('dd');
      res.body.references[1].referent.should.equal(id);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should get the overwriting property when getting the original note', function(done) {

    let lastId;
    chai.request(server)
      .get('/notes?forum=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].id.should.equal(noteId);
      res.body.notes[0].details.should.not.have.property('original');
      res.body.notes[0].details.should.have.property('overwriting');
      res.body.notes[0].details.overwriting.length.should.equal(4);
      res.body.notes[0].details.overwriting.should.contains(overwrittenId);
      lastId = res.body.notes[0].details.overwriting[3];
      return chai.request(server)
        .get('/notes?forum=' + overwrittenId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].id.should.equal(overwrittenId);
      res.body.notes[0].details.should.have.property('original');
      res.body.notes[0].details.original.id.should.equal(noteId);
      res.body.notes[0].details.should.have.property('overwriting');
      res.body.notes[0].details.overwriting.length.should.equal(1);
      res.body.notes[0].details.overwriting.should.contains(secondOverwrittenId);
      return chai.request(server)
        .get('/forum?id=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.redirects.should.be.a('array');
      res.redirects.length.should.equal(1);
      res.redirects[0].should.equal('http://localhost:3001/forum?id=' + lastId);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should create an anonymous paper submission with anonymous paperhash', function(done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(response){
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] })
    })
    .then(function(response){
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
        'pdfTransfer': 'url',
        'content': {
          'title': 'this is a paper title',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User.'],
          'authorids': ['test@host.com'],
          'conflicts': 'umass.edu',
          'CMT_id': '',
          'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
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
      res.body.number.should.equal(1);
      res.body.should.have.property('tauthor');
      res.body.tauthor.should.equal(superUser);
      res.body.signatures.should.eql(['~Super_User1']);
      res.body.writers.should.eql(['~Test_User1']);
      res.body.readers.should.eql(['everyone']);
      res.body.nonreaders.should.eql([]);
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equal('user|this_is_a_paper_title');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        original: res.body.id,
        'invitation': 'ICC.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'authors': ['Anonymous'],
          'authorids': ['Anonymous']
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equal('anonymous|this_is_a_paper_title');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should delete an original note and all the overwritten notes should be deleted too', function(done) {

    let overwrittenNotes = [];
    let originalNote;
    const now = Date.now();
    chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].id.should.equal(noteId);
      originalNote = res.body.notes[0];
      return chai.request(server)
        .get('/notes?original=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(4);
      res.body.notes[0].original.should.equals(originalNote.id);
      res.body.notes[1].original.should.equals(originalNote.id);
      res.body.notes[2].original.should.equals(originalNote.id);
      res.body.notes[3].original.should.equals(originalNote.id);
      overwrittenNotes = res.body.notes;
      originalNote.ddate = now;
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send(originalNote);
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].ddate.should.equal(now);
      return chai.request(server)
        .get('/notes?original=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      return chai.request(server)
        .get('/notes?id=' + overwrittenNotes[0].id)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(404);
      return chai.request(server)
        .get('/notes?id=' + overwrittenNotes[0].id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].ddate.should.equal(now);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });


});
