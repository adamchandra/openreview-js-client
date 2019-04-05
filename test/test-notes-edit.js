var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesEdit', function() {

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

  it('should create a note and edit only the allowed fields', function(done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(response) {
      return utils.createInvitationP('ICC.cc/-/submission2', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(response) {
      return chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC.cc/-/submission',
            'forum': null,
            'replyto': null,
            'signatures': ['~Super_User1'],
            'writers': ['~Test_User1'],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED Title|1?.',
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
      noteId = res.body.id;
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
      res.body.notes[0].number.should.equal(1);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(superUser);
      res.body.notes[0].signatures.should.eql(['~Super_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].content.should.have.property('paperhash');
      res.body.notes[0].content.paperhash.should.equal('user|should_succeed_title1');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': noteId,
        'invitation': 'ICC.cc/-/submission2',
        'forumContent': { title: 'forum title'},
        'tags': [ 'tag_1', 'tag_2'],
        'forum': 222,
        'replyto': 333,
        'signatures': ['~Test_User1'],
        'writers': ['~Test_User1', 'everyone'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'EDITED SHOULD SUCCEED 1',
          'abstract': 'Edited The abstract of test paper 1',
          'authors': ['Test User', 'Melisa Bok'],
          'authorids': ['test@host.com', 'mbok@cs.umass.edu'],
          'conflicts': 'cs.umass.edu',
          'CMT_id': 'qqqq',
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
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('user|edited_should_succeed_1');
      res.body.invitation.should.equals('ICC.cc/-/submission');
      res.body.should.not.have.property('forumContent');
      res.body.should.not.have.property('tags');
      res.body.tauthor.should.equal(user);
      res.body.signatures.should.eql(['~Test_User1']);
      res.body.writers.should.eql(['~Test_User1', 'everyone']);
      res.body.readers.should.eql(['everyone']);
      res.body.nonreaders.should.eql([]);
      res.body.content.title.should.equals('EDITED SHOULD SUCCEED 1');
      res.body.content.abstract.should.equals('Edited The abstract of test paper 1');
      res.body.content.authors.should.eql(['Test User', 'Melisa Bok']);
      res.body.content.authorids.should.eql(['test@host.com', 'mbok@cs.umass.edu']);
      res.body.content.conflicts.should.equals('cs.umass.edu');
      res.body.content['CMT_id'].should.equals('qqqq');
      res.body.content.pdf.should.equals('http://arxiv.org/pdf/1506.03425v1.pdf');
      res.body.forum.should.equals(noteId);
      should.equal(res.body.replyto, null);
      should.equal(res.body.ddate, null);
      should.equal(res.body.tddate, null);
      res.body.tcdate.should.not.equals(res.body.tmdate);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a note and edit the invitation as a super user', function(done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(response) {
      return utils.createInvitationP('ICC.cc/-/submission2', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(response) {
      return chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC.cc/-/submission',
            'forum': null,
            'replyto': null,
            'signatures': ['~Super_User1'],
            'writers': ['~Test_User1'],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED Title|1?.',
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
      noteId = res.body.id;
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
      res.body.notes[0].number.should.equal(2);
      res.body.notes[0].should.have.property('tauthor');
      res.body.notes[0].tauthor.should.equal(superUser);
      res.body.notes[0].signatures.should.eql(['~Super_User1']);
      res.body.notes[0].writers.should.eql(['~Test_User1']);
      res.body.notes[0].readers.should.eql(['everyone']);
      res.body.notes[0].nonreaders.should.eql([]);
      res.body.notes[0].content.should.have.property('paperhash');
      res.body.notes[0].content.paperhash.should.equal('user|should_succeed_title1');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': noteId,
        'invitation': 'ICC.cc/-/submission2',
        'forum': null,
        'replyto': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED Title|1?.',
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
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('user|should_succeed_title1');
      res.body.invitation.should.equals('ICC.cc/-/submission2');
      res.body.should.not.have.property('forumContent');
      res.body.should.not.have.property('tags');
      res.body.tauthor.should.equal(superUser);
      res.body.signatures.should.eql(['~Super_User1']);
      res.body.writers.should.eql(['~Test_User1']);
      res.body.readers.should.eql(['everyone']);
      res.body.nonreaders.should.eql([]);
      res.body.content.title.should.equals('SHOULD SUCCEED Title|1?.');
      res.body.content.abstract.should.equals('The abstract of test paper 1');
      res.body.content.authors.should.eql(['Test User.']);
      res.body.content.authorids.should.eql(['test@host.com']);
      res.body.content.conflicts.should.equals('umass.edu');
      res.body.content['CMT_id'].should.equals('');
      res.body.content.pdf.should.equals('http://arxiv.org/pdf/1506.03425v1.pdf');
      res.body.forum.should.equals(noteId);
      should.equal(res.body.replyto, null);
      should.equal(res.body.ddate, null);
      should.equal(res.body.tddate, null);
      res.body.tcdate.should.not.equals(res.body.tmdate);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': noteId,
        'invitation': 'ICC.cc/-/submission3',
        'forum': null,
        'replyto': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED Title|1?.',
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
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.message.should.equals('Not Found');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      res.body.errors[0].path.should.equal('invitation');
      res.body.errors[0].value.should.equal('ICC.cc/-/submission3');
      done();
    })    
    .catch(function(error) {
      done(error);
    });
  });  

});
