var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

chai.should();
chai.use(chaiHttp);

describe('NotesReferences', function() {

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

  it('should create a note and get the reference with the same id', function(done) {
    utils.createGroupP('ab.com', superUser, superToken, ['everyone'])
    .then(function(res) {
      res.should.have.status(200);
      return utils.createInvitationP('ab.com/-/submission', 'ab.com', superToken, {
        first: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ab.com/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'first': 'TestFirst',
            'middle': 'TestMiddle'
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
      var noteId = res.body.id;
      chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].invitation.should.equal('ab.com/-/submission');
          res.body.notes[0].content.first.should.equal('TestFirst');
          res.body.notes[0].content.middle.should.equal('TestMiddle');
          var tcdate = res.body.notes[0].tcdate;
          var tmdate = res.body.notes[0].tmdate;
          tcdate.should.equal(tmdate);
          chai.request(server)
          .get('/references?referent=' + noteId)
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('references');
            res.body.references.should.be.a('array');
            res.body.references.length.should.equal(1);
            res.body.references[0].tcdate.should.equal(tcdate);
            res.body.references[0].tmdate.should.equal(tmdate);
            res.body.references[0].content.should.not.have.property('TestFirst');
            res.body.references[0].content.middle.should.equal('TestMiddle');
            chai.request(server)
            .get('/references?referent=' + noteId + '&original=true')
            .set('Authorization', 'Bearer ' + testToken)
            .set('User-Agent', 'test-create-script')
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('references');
              res.body.references.should.be.a('array');
              res.body.references.length.should.equal(1);
              res.body.references[0].tcdate.should.equal(tcdate);
              res.body.references[0].tmdate.should.equal(tmdate);
              res.body.references[0].content.should.not.have.property('TestFirst');
              res.body.references[0].content.middle.should.equal('TestMiddle');
              res.body.references[0].tauthor.should.equal(user);
              chai.request(server)
              .get('/references?referent=' + noteId + '&original=true')
              .set('User-Agent', 'test-create-script')
              .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('references');
                res.body.references.should.be.a('array');
                res.body.references.length.should.equal(1);
                res.body.references[0].tcdate.should.equal(tcdate);
                res.body.references[0].tmdate.should.equal(tmdate);
                res.body.references[0].content.should.not.have.property('TestFirst');
                res.body.references[0].content.middle.should.equal('TestMiddle');
                res.body.references[0].should.not.have.property('tauthor');
                done();
              });
            });
          });
        });
    })
    .catch(done);
  });

  it('should create a note and reference that refers to it', function(done) {
    var noteId;
    var tcdate;
    var tmdate;
    utils.createGroupP('abc.com', superUser, superToken, ['everyone'])
    .then(function(res){
      return utils.createInvitationP('abc.com/-/submission', 'abc.com', superToken, {
        first: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] })
    })
    .then(function(res) {
      return utils.createInvitationP('abc.com/-/ref', 'abc.com', superToken, {
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        last: {
          order: 3,
          'value-regex': '.{1,100}',
        }
      }, { values: ['pc'] });
    })
    .then(function(res) {
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'TestFirst',
          'middle': 'TestMiddle'
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
      res.body.signatures.should.eql(['~Test_User1']);
      res.body.writers.should.eql(['~Test_User1']);
      noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['pc'],
        'content': {
          'middle': 'TestMiddle2',
          'last': 'TestLast'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
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
      res.body.notes[0].content.first.should.equal('TestFirst');
      res.body.notes[0].content.middle.should.equal('TestMiddle2');
      res.body.notes[0].content.last.should.equal('TestLast');
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      tcdate = res.body.notes[0].tcdate;
      tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
      return chai.request(server)
      .get('/references?referent=' + noteId)
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
      res.body.references[0].content.should.not.have.property('first');
      res.body.references[0].content.middle.should.equal('TestMiddle2');
      res.body.references[0].content.last.should.equal('TestLast');
      res.body.references[0].id.should.not.equal(noteId);
      res.body.references[0].tcdate.should.not.equal(tcdate);
      res.body.references[0].tmdate.should.equal(tmdate);
      res.body.references[1].content.should.not.have.property('last');
      res.body.references[1].content.first.should.equal('TestFirst');
      res.body.references[1].content.middle.should.equal('TestMiddle');
      res.body.references[1].tcdate.should.equal(tcdate);
      res.body.references[1].tmdate.should.not.equal(tmdate);
      return chai.request(server)
      .get('/references?referent=' + noteId + '&original=true')
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
      res.body.references[0].content.should.not.have.property('first');
      res.body.references[0].content.middle.should.equal('TestMiddle2');
      res.body.references[0].content.last.should.equal('TestLast');
      res.body.references[0].id.should.not.equal(noteId);
      res.body.references[0].tcdate.should.not.equal(tcdate);
      res.body.references[0].tmdate.should.equal(tmdate);
      res.body.references[1].content.should.not.have.property('last');
      res.body.references[1].content.first.should.equal('TestFirst');
      res.body.references[1].content.middle.should.equal('TestMiddle');
      res.body.references[1].tcdate.should.equal(tcdate);
      res.body.references[1].tmdate.should.not.equal(tmdate);
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
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(1);
      res.body.references[0].content.should.not.have.property('last');
      res.body.references[0].content.first.should.equal('TestFirst');
      res.body.references[0].content.middle.should.equal('TestMiddle');
      res.body.references[0].tcdate.should.equal(tcdate);
      res.body.references[0].tmdate.should.not.equal(tmdate);
      return chai.request(server)
      .get('/references?referent=' + noteId + '&original=true')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(1);
      res.body.references[0].content.should.not.have.property('last');
      res.body.references[0].content.first.should.equal('TestFirst');
      res.body.references[0].content.middle.should.equal('TestMiddle');
      res.body.references[0].tcdate.should.equal(tcdate);
      res.body.references[0].tmdate.should.not.equal(tmdate);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should create a note and reference that refers to it with readers restrictions', function(done) {
    var noteId;
    var tcdate;
    var tmdate;
    utils.createGroupP('abc.com', superUser, superToken, ['everyone'])
    .then(function(res){
      return utils.createInvitationP('abc.com/-/submission', 'abc.com', superToken, {
        first: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { 'values-regex': '~.*' })
    })
    .then(function(res) {
      return utils.createInvitationP('abc.com/-/ref', 'abc.com', superToken, {
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        last: {
          order: 3,
          'value-regex': '.{1,100}',
        }
      }, { 'values-regex': '~.*' });
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
        'writers': ['~Super_User1'],
        'readers': ['~Super_User1'],
        'content': {
          'first': 'TestFirst',
          'middle': 'TestMiddle'
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
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['~Super_User1'],
        'content': {
          'middle': 'TestMiddle2',
          'last': 'TestLast'
        }
      });
    })
    .then(function(res) {
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
      res.body.notes[0].content.first.should.equal('TestFirst');
      res.body.notes[0].content.middle.should.equal('TestMiddle2');
      res.body.notes[0].content.last.should.equal('TestLast');
      tcdate = res.body.notes[0].tcdate;
      tmdate = res.body.notes[0].tmdate;
      tcdate.should.not.equal(tmdate);
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
      res.body.references.should.be.a('array');
      res.body.references.length.should.equal(0);
      chai.request(server)
      .get('/references?referent=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('references');
        res.body.references.should.be.a('array');
        res.body.references.length.should.equal(2);
        res.body.references[0].content.should.not.have.property('first');
        res.body.references[0].content.middle.should.equal('TestMiddle2');
        res.body.references[0].content.last.should.equal('TestLast');
        res.body.references[0].tcdate.should.not.equal(tcdate);
        res.body.references[0].tmdate.should.equal(tmdate);
        res.body.references[0].readers.should.eql(['~Super_User1']);
        res.body.references[0].writers.should.eql(['~Super_User1']);
        res.body.references[1].content.should.not.have.property('last');
        res.body.references[1].content.first.should.equal('TestFirst');
        res.body.references[1].content.middle.should.equal('TestMiddle');
        res.body.references[1].tcdate.should.equal(tcdate);
        res.body.references[1].tmdate.should.not.equal(tmdate);
        res.body.references[1].readers.should.eql(['~Super_User1']);
        res.body.references[0].writers.should.eql(['~Super_User1']);
        done();
      })
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a reference, and get the reference by id', function(done) {
    utils.createGroupP('abcd.com', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('abcd.com/-/submission', 'abcd.com', superToken, {
        first: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('abcd.com/-/ref', 'abcd.com', superToken, {
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        last: {
          order: 3,
          'value-regex': '.{1,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcd.com/-/submission',
        'referenti': ['abcd.com/-/ref'],
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'TestFirst',
          'middle': 'TestMiddle'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcd.com/-/ref',
        'referent': response.body.id,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'middle': 'TestMiddle2',
          'last': 'TestLast'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      var refId = response.body.id;
      chai.request(server)
      .get('/notes?id=' + response.body.referent)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('notes');
        res.body.notes.should.be.a('array');
        res.body.notes.length.should.equal(1);
        res.body.notes[0].content.first.should.equal('TestFirst');
        res.body.notes[0].content.middle.should.equal('TestMiddle2');
        res.body.notes[0].content.last.should.equal('TestLast');
        done();
      })
    })
    .catch(function(error) {
      console.log('Error: ', error);
      done(error);
    })

  });

  it('should create a reference, and update the reference by id', function(done) {
    var noteId = "";
    var refId = "";
    var number;
    utils.createGroupP('abcde.com', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('abcde.com/-/submission', 'abcde.com', superToken, {
        first: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('abcde.com/-/ref', 'abcde.com', superToken, {
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        last: {
          order: 3,
          'value-regex': '.{1,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcde.com/-/submission',
        'referenti': ['abcde.com/-/ref'],
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'TestFirst',
          'middle': 'TestMiddle'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      noteId = response.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcde.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'middle': 'TestMiddle2',
          'last': 'TestLast'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      response.body.referent.should.equals(noteId);
      response.body.should.have.property('number');
      refId = response.body.id;
      number = response.body.number;
      return chai.request(server)
      .get('/references?referent=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(2);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': refId,
        'number': number,
        'invitation': 'abcde.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'middle': 'TestMiddle2',
          'last': 'EditedTestLast'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      response.body.should.have.property('number');
      response.body.number.should.equals(number);
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('notes');
      response.body.notes.should.be.a('array');
      response.body.notes.length.should.equal(1);
      response.body.notes[0].content.first.should.equal('TestFirst');
      response.body.notes[0].content.middle.should.equal('TestMiddle2');
      response.body.notes[0].content.last.should.equal('EditedTestLast');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should create a reference, update the note and descructive the reference', function(done) {
    var noteId = "";
    var refId = "";
    var tcdate;
    var tmdate;
    utils.createGroupP('abcde.com', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('abcde.com/-/submission', 'abcde.com', superToken, {
        first: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('abcde.com/-/ref', 'abcde.com', superToken, {
        middle: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        last: {
          order: 3,
          'value-regex': '.{1,100}',
        }
      }, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcde.com/-/submission',
        'referenti': ['abcde.com/-/ref'],
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'TestFirst',
          'middle': 'TestMiddle',
          'last': 'TestLast'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      noteId = response.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcde.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'TestFirst2',
          'middle': 'TestMiddle2',
          'last': 'TestLast2'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcde.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'TestFirst3',
          'middle': 'TestMiddle3',
          'last': 'TestLast2'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('notes');
      response.body.notes.should.be.a('array');
      response.body.notes.length.should.equal(1);
      response.body.notes[0].content.first.should.equal('TestFirst3');
      response.body.notes[0].content.middle.should.equal('TestMiddle3');
      response.body.notes[0].content.last.should.equal('TestLast2');
      tcdate = response.body.notes[0].tcdate;
      tmdate = response.body.notes[0].tmdate;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abcde.com/-/submission',
        'id': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'first': 'EditedTestFirst3',
          'middle': 'TestMiddle3',
          'last': 'TestLast4'
        }
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      return chai.request(server)
      .get('/notes?id=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('notes');
      response.body.notes.should.be.a('array');
      response.body.notes.length.should.equal(1);
      response.body.notes[0].content.first.should.equal('EditedTestFirst3');
      response.body.notes[0].content.middle.should.equal('TestMiddle3');
      response.body.notes[0].content.last.should.equal('TestLast4');
      response.body.notes[0].tcdate.should.equal(tcdate);
      response.body.notes[0].tmdate.should.not.equal(tmdate);
      done();
    })
    .catch(function(error) {
      console.log('Error: ', error);
      done(error);
    })

  });

  it('should create a note with title and a reference that refers to it changing the begining of the title', function(done) {
    var noteId;
    utils.createGroupP('abc.com', superUser, superToken, ['everyone'])
    .then(function(res){
      return utils.createInvitationP('abc.com/-/submission', 'abc.com', superToken, {
        title: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        abstract: {
          order: 2,
          'value-regex': '.{0,100}',
        }
      }, { values: ['everyone'] })
    })
    .then(function(res) {
      return utils.createInvitationP('abc.com/-/ref', 'abc.com', superToken, {
        title: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        abstract: {
          order: 3,
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
        'readers': ['everyone'],
        'content': {
          'title': 'A Fast Algorithm for Matrix Eigen-decomposition',
          'abstract': 'test abstract'
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
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'A Fast Algorithm for Matrix Eigen-decomposition Rev 1',
          'abstract': 'test abstract'
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
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'Pre A Fast Algorithm for Matrix Eigen-decomposition Rev 1',
          'abstract': 'test abstract'
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
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'A Fast Algorithm for Matrix Eigen-decomposition Rev 1',
          'abstract': 'test abstract'
        }
      });
    })
    .then(function(res) {
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
      res.body.notes[0].content.title.should.equal('A Fast Algorithm for Matrix Eigen-decomposition Rev 1');
      res.body.notes[0].content.abstract.should.equal('test abstract');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should create a note with title and author and a reference with the same paper hash', function(done) {
    var noteId;
    utils.createGroupP('abc.com', superUser, superToken, ['everyone'])
    .then(function(res){
      return utils.createInvitationP('abc.com/-/submission', 'abc.com', superToken, {
        title: {
          order: 1,
          'value-regex': '.{1,100}',
        },
        abstract: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        authors: {
          order: 3,
          'values-regex': "[^;,\\n]+(,[^,\\n]+)*",
        }
      }, { values: ['everyone'] })
    })
    .then(function(res) {
      return utils.createInvitationP('abc.com/-/ref', 'abc.com', superToken, {
        title: {
          order: 2,
          'value-regex': '.{0,100}',
        },
        abstract: {
          order: 3,
          'value-regex': '.{1,100}',
        },
        authors: {
          order: 3,
          'values-regex': "[^;,\\n]+(,[^,\\n]+)*",
        }
      }, { values: ['everyone'] });
    })
    .then(function(res) {
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'A Fast Algorithm for Matrix Eigen-decomposition',
          'abstract': 'test abstract',
          'authors': ['Melisa Bok']
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
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|a_fast_algorithm_for_matrix_eigendecomposition');
      noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'A Fast Algorithm for Matrix Eigen-decomposition Rev 1',
          'abstract': 'test abstract',
          'authors': ['Melisa Bok']
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
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|a_fast_algorithm_for_matrix_eigendecomposition_rev_1');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'Pre A Fast Algorithm for Matrix Eigen-decomposition Rev 1',
          'abstract': 'test abstract',
          'authors': ['Melisa Bok']
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
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|pre_a_fast_algorithm_for_matrix_eigendecomposition_rev_1');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'abc.com/-/ref',
        'referent': noteId,
        'signatures': ['~Super_User1'],
        'writers': ['~Super_User1'],
        'readers': ['everyone'],
        'content': {
          'title': 'A Fast Algorithm for Matrix Eigen-decomposition Rev 1',
          'abstract': 'test abstract',
          'authors': ['Melisa Bok']
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
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|a_fast_algorithm_for_matrix_eigendecomposition_rev_1');
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
      res.body.notes[0].content.title.should.equal('A Fast Algorithm for Matrix Eigen-decomposition Rev 1');
      res.body.notes[0].content.abstract.should.equal('test abstract');
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should get references by invitation', function(done) {
    chai.request(server)
    .get('/references?invitation=abc.com/-/ref')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(8);
      response.body.references[0].invitation.should.equals('abc.com/-/ref');
      response.body.references[1].invitation.should.equals('abc.com/-/ref');
      response.body.references[2].invitation.should.equals('abc.com/-/ref');
      response.body.references[3].invitation.should.equals('abc.com/-/ref');
      response.body.references[4].invitation.should.equals('abc.com/-/ref');
      response.body.references[5].invitation.should.equals('abc.com/-/ref');
      response.body.references[6].invitation.should.equals('abc.com/-/ref');
      response.body.references[7].invitation.should.equals('abc.com/-/ref');
      return chai.request(server)
      .get('/references?invitation=sdlfkjsdk')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    })
  })

  it('should get references by regex invitation', function(done) {
    chai.request(server)
    .get('/references?invitation=abc.com/-/.*')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(12);
      response.body.references[0].invitation.should.equals('abc.com/-/ref');
      response.body.references[1].invitation.should.equals('abc.com/-/ref');
      response.body.references[2].invitation.should.equals('abc.com/-/ref');
      response.body.references[3].invitation.should.equals('abc.com/-/submission');
      response.body.references[4].invitation.should.equals('abc.com/-/ref');
      response.body.references[5].invitation.should.equals('abc.com/-/ref');
      response.body.references[6].invitation.should.equals('abc.com/-/ref');
      response.body.references[7].invitation.should.equals('abc.com/-/submission');
      response.body.references[8].invitation.should.equals('abc.com/-/ref');
      response.body.references[9].invitation.should.equals('abc.com/-/submission');
      response.body.references[10].invitation.should.equals('abc.com/-/ref');
      response.body.references[11].invitation.should.equals('abc.com/-/submission');
      return chai.request(server)
      .get('/references?invitation=wwww.com/-/.*')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    })
  })

  it('should get references by regex invitation and mintcdate', function(done) {
    var now = Date.now()
    chai.request(server)
    .get('/references?invitation=abc.com/-/.*&mintcdate=' + now)
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(0);
      return chai.request(server)
      .get('/references?invitation=abc.com/-/.*&mintcdate=' + (now - 1000))
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.not.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    })
  })

  it('should get references using a guest user and can not see the tauthor', function(done) {
    var now = Date.now()
    chai.request(server)
    .get('/references')
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(17);
      response.body.references[0].should.not.have.property('tauthor');
      done();
    })
    .catch(function(error) {
      done(error);
    })
  })
});
