var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesGet', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  let guestToken = '';
  var beforeNow = Date.now();

  var replyContent = {
    "title": {
      "order": 1,
      "value-regex": ".{0,500}",
      "description": "Brief summary of your review."
    },
    "review": {
      "order": 2,
      "value-regex": "[\\S\\s]{1,5000}",
      "description": "Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
    },
    "rating": {
      "order": 3,
      "value-dropdown": [1, 2, 3, 4]
    },
    "confidence": {
      "order": 4,
      "value-radio": [1, 2, 3]
    }
  }

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

  var submissionForum;

  it('should create notes by invitation', function (done) {
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, replyContent, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          submissionForum = res.body.id;
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          done();
        });
      });
    });
  });

  it('should get notes by invitation and maxtcdate for super user will be writable', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&maxtcdate=' + Date.now())
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(user);
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.replyCount.should.equal(0);
      res.body.notes[0].should.not.have.property('_id');
      res.body.notes[0].should.not.have.property('_key');
      res.body.notes[0].should.not.have.property('_rev');
      res.body.notes[0].should.not.have.property('active');
      done();
    });
  });

  it('should get notes by invitation with details only replyCount', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&details=replyCount')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(user);
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.should.not.have.property('writable');
      res.body.notes[0].details.should.not.have.property('original');
      res.body.notes[0].details.should.not.have.property('overwriting');
      res.body.notes[0].details.should.not.have.property('revisions');
      res.body.notes[0].details.should.not.have.property('tags');
      res.body.notes[0].details.should.not.have.property('forumContent');
      res.body.notes[0].details.should.have.property('replyCount');
      res.body.notes[0].details.replyCount.should.equal(0);
      res.body.notes[0].should.not.have.property('_id');
      res.body.notes[0].should.not.have.property('_key');
      res.body.notes[0].should.not.have.property('_rev');
      res.body.notes[0].should.not.have.property('active');
      done();
    });
  });


  it('should get notes by invitation and maxtcdate as super user will be writable', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&details=replyCount,writable&maxtcdate=' + Date.now())
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(user);
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.writable.should.equal(true);
      res.body.notes[0].details.replyCount.should.equal(0);
      done();
    });
  });

  it('should get notes by invitation and maxtcdate as guest will not be writable', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&details=replyCount,writable&maxtcdate=' + Date.now())
    .set('Authorization', 'Bearer ' + guestToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.not.have.property('tauthor');
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.writable.should.equal(false);
      res.body.notes[0].details.replyCount.should.equal(0);
      done();
    });
  });

  it('should get notes by invitation via RegEx and maxtcdate as writer will be writable', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.*/-/submission&details=replyCount,writable&maxtcdate=' + Date.now())
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('ICC.cc/-/submission');
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.writable.should.equal(true);
      res.body.notes[0].details.replyCount.should.equal(0);
      return chai.request(server)
      .get('/invitations?id=ICC.cc/-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      var invitation = res.body.invitations[0];
      invitation.expdate = Date.now();
      return chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send(invitation);
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      return chai.request(server)
      .get('/notes?invitation=ICC.*/-/submission&details=replyCount,writable&maxtcdate=' + Date.now())
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('ICC.cc/-/submission');
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.writable.should.equal(false);
      res.body.notes[0].details.replyCount.should.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should get notes and invitations that the user is invited to but has not yet completed', function (done) {
    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'ICC.cc/-/Comment',
      'signatures': [superUser],
      'writers': [superUser],
      'readers': ['everyone'],
      'invitees': ['~Test_User1'],
      'duedate': 9999999999, //NOTE: this test will only be valid until November, in the year 2286.
      'reply': {
        forum: submissionForum,
        replyto: submissionForum,
        readers: {'values-regex': '.+'},
        signatures: {'values-regex': '.+'},
        writers: {'values-regex': '.+'},
        content: {
          'comment': {
            'order': 1,
            'value-regex': '.{0,50}',
            'description': 'comment'
          }
        }
      }
    })
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      return chai.request(server)
      .get('/notes?invitation=ICC.cc/-/.*&invitee=true&duedate=true')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].should.have.property('replytoNote');
      res.body.notes[0].should.have.property('invitation');
      res.body.notes[0].replytoNote.should.have.property('invitation');
      res.body.notes[0].replytoNote.invitation.should.eql('ICC.cc/-/submission');
      return chai.request(server)
      .get('/notes?invitation=ICC.cc/-/submission&invitee=true&duedate=true')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].should.have.property('replytoNote');
      res.body.notes[0].should.have.property('invitation');
      res.body.notes[0].replytoNote.should.have.property('invitation');
      res.body.notes[0].replytoNote.invitation.should.eql('ICC.cc/-/submission');
      done();
    })
    .catch(done);
  });

  it('should try to get notes and invitations, but fail because the user is not invited', function(done){
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/.*&invitee=true&duedate=true')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      return chai.request(server)
      .get('/notes?invitation=ICC.cc/-/Comment&invitee=true&duedate=true')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    })
    .catch(done);
  });

  it('should try to get notes and invitations, but fail because the invitation doesn\'t exist', function(done){
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/somethingElse.*&invitee=true&duedate=true')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      return chai.request(server)
      .get('/notes?invitation=ICC.cc/-/SomeOtherInvitation&invitee=true&duedate=true')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function (res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    })
    .catch(done);
  });


  it('should get notes by invitation and number for super user', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&number=1')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(user);
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].details.replyCount.should.equal(0);
      done();
    });
  });


  it('should get notes by invitation and non existent number for super user', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&number=10')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    });
  });

  it('should get notes by invitation and a list of number for super user', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&number=1,2,3')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(user);
      res.body.notes[0].signatures.should.eql(['~Test_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      done();
    })
  });

  it('should get notes by an empty list of number and get an empty result', function (done) {
    chai.request(server)
    .get('/notes?invitation=ICC.cc/-/submission&number=')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    })
  });


  it('should get notes by invitation and an array of numbers for super user', function (done) {
    chai.request(server)
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
        'title': 'SHOULD SUCCEED 2',
        'review': 'The abstract of test paper 2',
        'rating': '2',
        'confidence': '2'
      }
    })
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');

      chai.request(server)
      .get('/notes?invitation=ICC.cc/-/submission&details=replyCount,writable&number=1,2,3')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('notes');
        res.body.notes.should.be.a('array');
        res.body.notes.length.should.equal(2);
        res.body.notes[0].number.should.equal(parseInt(res.body.notes[0].content.rating));
        res.body.notes[0].content.title.should.equal('SHOULD SUCCEED 2');
        res.body.notes[0].should.have.property('tauthor');
        res.body.notes[0].tauthor.should.equal(superUser);
        res.body.notes[0].signatures.should.eql(['~Super_User1']);
        res.body.notes[0].writers.should.eql(['~Test_User1']);
        res.body.notes[0].readers.should.eql(['everyone']);
        res.body.notes[0].nonreaders.should.eql([]);
        res.body.notes[0].details.writable.should.equal(true);
        res.body.notes[0].details.replyCount.should.equal(0);
        res.body.notes[1].number.should.equal(parseInt(res.body.notes[1].content.rating));
        res.body.notes[1].content.title.should.equal('SHOULD SUCCEED 1');
        res.body.notes[1].should.have.property('tauthor');
        res.body.notes[1].tauthor.should.equal(user);
        res.body.notes[1].signatures.should.eql(['~Test_User1']);
        res.body.notes[1].writers.should.eql(['~Test_User1']);
        res.body.notes[1].readers.should.eql(['everyone']);
        res.body.notes[1].nonreaders.should.eql([]);
        res.body.notes[1].details.writable.should.equal(true);
        res.body.notes[1].details.replyCount.should.equal(0);
        done();
      });
    });
  });

  it('should get by id being a nonreader and get a forbidden error', function (done) {
    utils.createGroup('ICC2.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC2.cc/-/submission', 'ICC.cc', superToken, replyContent, {values: ['~Super_User1']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC2.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Super_User1'],
          'readers': ['~Super_User1'],
          'content': {
            'title': 'SHOULD SUCCEED 3',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          let noteId = res.body.id;
          chai.request(server)
          .get('/notes?id=' + noteId)
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .end(function (err, res) {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.name.should.equals('forbidden');
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            res.body.errors.length.should.equal(1);
            res.body.errors[0].type.should.equal('forbidden');
            done();
          })
        });
      });
    });
  });

  it('should get by id an nonexistent note and get an error', function (done) {
    chai.request(server)
    .get('/notes?id=zzzzzz')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      done();
    })
  });


  it('should get notes by forum and be writeable for testUser', function (done) {
    let id = 'MCZ.cc';
    let forum = 'MCZForum';
    utils.createGroup(id, superUser, superToken, ['everyone'], function () {
      utils.createInvitation(id + '/-/submission', id, superToken, replyContent, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': id + '/-/submission',
          'forum': forum,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 4',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          let noteId = res.body.id;
          chai.request(server)
          .get('/notes?forum=' + forum)
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('notes');
            res.body.notes.should.be.a('array');
            res.body.notes.length.should.equal(1);
            res.body.notes[0].number.should.equal(1);
            // originally the writable flag was based on tauthor, this
            // check confirms that we're using the writers field.
            res.body.notes[0].tauthor.should.not.eql(res.body.notes[0].writers[0])
            res.body.notes[0].writers.should.eql(['~Test_User1']);
            res.body.notes[0].details.writable.should.equal(true);
            done();
          })
        });
      });
    });
  });


  it('should get notes by forum and NOT be writeable for guest', function (done) {
    let id = 'MCZ-2.cc';
    let forum = 'MCZForum2';
    utils.createGroup(id, superUser, superToken, ['everyone'], function () {
      utils.createInvitation(id + '/-/submission', id, superToken, replyContent, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': id + '/-/submission',
          'forum': forum,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 5',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          let noteId = res.body.id;
          chai.request(server)
          .get('/notes?forum=' + forum)
          .set('User-Agent', 'test-create-script')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('notes');
            res.body.notes.should.be.a('array');
            res.body.notes.length.should.equal(1);
            res.body.notes[0].number.should.equal(1);
            res.body.notes[0].writers.should.eql(['~Test_User1']);
            res.body.notes[0].details.writable.should.equal(false);
            done();
          });
        });
      });
    });
  });

  it('should get notes by forum and be writable by group rather than specific user', function (done) {
    let id = 'MCZ-3.cc';
    let groupId = 'testGroup-AnnonReviewer';
    let forum = 'MCZForum3';
    utils.createGroup(id, superUser, superToken, ['everyone'], function () {
      utils.createInvitation(id + '/-/submission', id, superToken, replyContent, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': groupId,
          'signatures': [],
          'writers': [],
          'members': ['~Test_User1'],
          'readers': [],
          'signatories': []
        })
        .end(function (err, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('id');
          chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': id + '/-/submission',
            'forum': forum,
            'parent': null,
            'signatures': ['~Super_User1'],
            'writers': [groupId],
            'readers': ['everyone'],
            'content': {
              'title': 'SHOULD SUCCEED 6',
              'review': 'The abstract of test paper 1',
              'rating': '1',
              'confidence': '1'
            }
          })
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            res.body.id.should.be.a('string');
            res.body.id.should.not.equals('');
            let noteId = res.body.id;
            chai.request(server)
            .get('/notes?forum=' + forum)
            .set('Authorization', 'Bearer ' + testToken)
            .set('User-Agent', 'test-create-script')
            .end(function (err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('notes');
              res.body.notes.should.be.a('array');
              res.body.notes.length.should.equal(1);
              res.body.notes[0].number.should.equal(1);
              res.body.notes[0].writers.should.eql([groupId]);
              res.body.notes[0].details.writable.should.equal(true);
              done();
            });
          });
        });
      });
    });
  });

  it('should get notes by limit', function (done) {
    chai.request(server)
    .get('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(6);
      chai.request(server)
      .get('/notes?limit=3')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('notes');
        res.body.notes.should.be.a('array');
        res.body.notes.length.should.equal(3);
        res.body.notes[0].content.title.should.equals('SHOULD SUCCEED 6');
        res.body.notes[1].content.title.should.equals('SHOULD SUCCEED 5');
        res.body.notes[2].content.title.should.equals('SHOULD SUCCEED 4');
        chai.request(server)
        .get('/notes?limit=3&offset=5')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          done();
        });
      });
    });
  });

  it('should get notes by paperhash', function(done) {
    var noteId;
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function(){
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] }, function(){
        chai.request(server)
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
              'authors': ['Test User'],
              'author_emails': 'test@host.com',
              'conflicts': 'umass.edu',
              'CMT_id': '',
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          })
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            res.body.id.should.be.a('string');
            res.body.id.should.not.equals('');
            noteId = res.body.id;
            chai.request(server)
            .get('/notes?paperhash=user|this_is_a_paper_title')
            .set('Authorization', 'Bearer ' + superToken)
            .set('User-Agent', 'test-create-script')
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('notes');
              res.body.notes.should.be.a('array');
              res.body.notes.length.should.equal(1);
              res.body.notes[0].number.should.equal(3);
              res.body.notes[0].should.have.property('tauthor');
              res.body.notes[0].tauthor.should.equal(superUser);
              res.body.notes[0].signatures.should.eql(['~Super_User1']);
              res.body.notes[0].writers.should.eql(['~Test_User1']);
              res.body.notes[0].readers.should.eql(['everyone']);
              res.body.notes[0].nonreaders.should.eql([]);
              res.body.notes[0].content.should.have.property('paperhash');
              res.body.notes[0].content.paperhash.should.equal('user|this_is_a_paper_title');
              chai.request(server)
              .get('/notes?paperhash=user|this_is_a_paper')
              .set('Authorization', 'Bearer ' + superToken)
              .set('User-Agent', 'test-create-script')
              .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('notes');
                res.body.notes.should.be.a('array');
                res.body.notes.length.should.equal(0);
                done();
              });
            });
          });
      });
    });
  });

  it('should get notes by set of ids', function (done) {
    var ids = [];
    chai.request(server)
    .get('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(7);
      ids = res.body.notes.map(function(n) { return n.id });
      chai.request(server)
      .post('/notes/search')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        ids: ids
      })
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('notes');
        res.body.notes.should.be.a('array');
        res.body.notes.length.should.equal(7);
        var foundIds = res.body.notes.map(function(n) { return n.id });
        foundIds.should.eql(ids);
        res.body.count.should.equal(7);

        chai.request(server)
            .post('/notes/search')
            .set('Authorization', 'Bearer ' + superToken)
            .set('User-Agent', 'test-create-script')
            .send({
              ids: [ids[0]]
            })
            .end(function (err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('notes');
              res.body.notes.should.be.a('array');
              res.body.notes.length.should.equal(1);
              res.body.notes[0].id.should.equal(ids[0]);
              done();
            });


      });
    });
  });

  it('should get notes by a reference invitation', function(done) {
    var forumId;
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
      result.body.should.be.a('object');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/upload',
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
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
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
      result.body.should.be.a('object');
      result.body.should.have.property('id');
      forumId = result.body.id;
      return chai.request(server)
        .get('/notes?invitation=workshop/-/upload')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(0);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          referent: forumId,
          invitation: 'workshop/-/upload',
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
        .get('/notes?invitation=workshop/-/upload')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      //result.body.notes.length.should.equal(1);
      //result.body.notes[0].invitation.should.equal('workshop/-/submission');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          referent: forumId,
          invitation: 'workshop/-/upload',
          signatures: ['reviewer-1'],
          readers: ['everyone'],
          writers: ['reviewer-1'],
          content: {
            title: 'this is a title',
            description: 'this is a description'
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/notes?invitation=workshop/-/upload')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      //result.body.notes.length.should.equal(1);
      //result.body.notes[0].invitation.should.equal('workshop/-/submission');
      done();
    })
    .catch(function(error) {
      console.log('error', error);
      done(error);
    })
  });

  it('should get notes sorted by tcdate', function (done) {
    utils.createGroupP('ICC20.cc', superUser, superToken)
    .then(function(result) {
      return utils.createGroupP('ICC20.cc/workshop', superUser, superToken);
    })
    .then(function(result) {
      return utils.createInvitationP('ICC20.cc/workshop/-/submission', 'ICC20.cc', superToken, replyContent, {values: ['~Super_User1']});
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC20.cc/workshop/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Super_User1'],
          'readers': ['~Super_User1'],
          'content': {
            'title': 'First note',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(result) {
      return chai.request(server)
      .get('/notes?invitation=ICC20.cc/workshop/-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].content.title.should.equal('First note');
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC20.cc/workshop/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Super_User1'],
          'readers': ['~Super_User1'],
          'content': {
            'title': 'Second note',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(result) {
      return chai.request(server)
      .get('/notes?invitation=ICC20.cc/workshop/-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(2);
      result.body.notes[0].content.title.should.equal('Second note');
    })
    .then(function(result) {
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC20.cc/workshop/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Super_User1'],
          'readers': ['~Super_User1'],
          'content': {
            'title': 'Third note',
            'review': 'The abstract of test paper 1',
            'rating': '1',
            'confidence': '1'
          }
        });
    })
    .then(function(result) {
      return chai.request(server)
      .get('/notes?invitation=ICC20.cc/.*//*-/submission')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(3);
      result.body.notes[0].content.title.should.equal('Third note');
      done();
    })
    .catch(done);
  });

  it('should get notes by min tcdate', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?mintcdate=' + now)
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      chai.request(server)
      .get('/notes?mintcdate=' + beforeNow)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('notes');
        res.body.notes.should.be.a('array');
        res.body.notes.length.should.equal(11);
        res.body.notes[0].tcdate.should.greaterThan(beforeNow);
        res.body.notes[10].tcdate.should.greaterThan(beforeNow);
        done();
      });
    });
  });

  it('should get notes with no details', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?noDetails=true')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(11);
      res.body.notes[0].should.not.have.property('replyCount');
      res.body.notes[0].should.not.have.property('revisions');
      res.body.notes[0].should.not.have.property('tags');
      res.body.notes[0].should.not.have.property('forumContent');
      done();
    });
  });

  it('should get notes with details', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?noDetails=false')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(11);
      res.body.notes[0].details.should.have.property('replyCount');
      done();
    });
  });

  it('should get notes by a field of the content', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?content.title=this is a title')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.should.have.property('title');
      res.body.notes[0].content.title.should.equals('this is a title');
      done();
    });
  });

  it('should get notes by a field of the content and get zero results', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?content.title=this is not a title')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    });
  });

  it('should get notes as a guest user and can not see the tauthor', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes')
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(7);
      res.body.notes[0].should.not.have.property('tauthor');
      done();
    });
  });

  it('should get notes with reply count sort options and get an error', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?sort=replyCount')
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.message.should.equals('Can not sort notes without an invitation filter');
      done();
    });
  });


  it('should get notes with reply count sort and an invitation get an ok', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?sort=replyCount&invitation=ICC.cc/-/submission')
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].should.have.property('details');
      res.body.notes[0].details.should.have.property('replyCount');
      done();
    });
  });

  it('should sort notes by number in ascending order', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?sort=number:asc&invitation=ICC.cc/-/submission')
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].number.should.equal(1);
      res.body.notes[1].number.should.equal(2);
      res.body.notes[2].number.should.equal(3);

      done();
    });
  });

  it('should sort notes by number in descending order', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?sort=number:desc&invitation=ICC.cc/-/submission')
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].number.should.equal(3);
      res.body.notes[1].number.should.equal(2);
      res.body.notes[2].number.should.equal(1);

      done();
    });
  });

  it('should sort notes by number with no specific order', function (done) {
    var now = Date.now();
    chai.request(server)
    .get('/notes?sort=number&invitation=ICC.cc/-/submission')
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].number.should.equal(3);
      res.body.notes[1].number.should.equal(2);
      res.body.notes[2].number.should.equal(1);

      done();
    });
  });

});



