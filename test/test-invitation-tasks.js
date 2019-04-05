
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');
var _ = require('lodash');

chai.use(chaiHttp);

describe('InvitationTasks', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "user@test.com";
  var authorToken = "";
  var reviewerToken = "";
  var noteId = "";
  var reviewId = "";
  var NOW = Date.now();
  before(function(done) {
    utils.setUp(function(aSuperToken, aTestToken){
      superToken = aSuperToken;
      testToken = aTestToken;
      utils.createAndLoginUser('author@test.com', "Authorfirst", "Authorlast")
      .then(function(token) {
        authorToken = token;
        utils.createAndLoginUser('reviewer@test.com', "Reviewerfirst", "Reviewerlast")
        .then(function(token) {
          reviewerToken = token;
          done();
        })
      })
    });
  });

  after(function(done) {
    utils.tearDown(done);
  });

  it('should create a workshop, post a paper, and create a review invitation', function(done) {
    utils.createGroupP('workshop', superUser, superToken)
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
          'duedate': Date.now(),
          'reply' : {
            forum: null,
            replyto: null,
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
        .set('Authorization', 'Bearer ' + authorToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['~Authorfirst_Authorlast1'],
          readers: ['everyone'],
          writers: ['~Authorfirst_Authorlast1'],
          content: {
            title: 'this is a title',
            authors: ['Authorfirst Authorlast', 'Test User'],
            authorids: ['author@test.com', 'test@test.com'],
            description: 'this is a description'
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + authorToken)
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
      result.body.notes[0].tauthor.should.equal('author@test.com');
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/review',
          'signatures': [superUser],
          'writers': [superUser],
          'readers': ['everyone'],
          'nonreaders': [],
          'invitees': ['reviewer@test.com'],
          'noninvitees':[],
          'duedate': 2481932799000,
          'reply' : {
            replyto:noteId,
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
                'description': 'review'
              },
            }
          }
        });
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      return chai.request(server)
        .get('/invitations?id=workshop/-/review')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('invitations');
      result.body.invitations.should.be.a('array');
      result.body.invitations.length.should.equal(1);
      result.body.invitations[0].id.should.equal('workshop/-/review');
      result.body.invitations[0].duedate.should.equal(2481932799000);
      result.body.invitations[0].reply.forum.should.equal(noteId);
      result.body.invitations[0].invitees.should.include('reviewer@test.com');
      done();
    })
  })


  it('should get pending invitations', function(done) {
    chai.request(server)
    .get('/invitations?invitee=true&duedate=true&details=replytoNote,repliedNotes')
    .set('Authorization', 'Bearer ' + reviewerToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(2);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.length.should.equals(0);
      response.body.invitations[1].id.should.equals('workshop/-/review');
      response.body.invitations[1].duedate.should.equal(2481932799000);
      response.body.invitations[1].should.have.property('details');
      response.body.invitations[1].details.should.have.property('replytoNote');
      response.body.invitations[1].details.replytoNote.invitation.should.equals('workshop/-/submission');
      response.body.invitations[1].details.replytoNote.should.not.have.property('tauthor');
      response.body.invitations[1].details.should.have.property('repliedNotes');
      response.body.invitations[1].details.repliedNotes.length.should.equals(0);
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + reviewerToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/review');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + reviewerToken)
        .set('User-Agent', 'test-create-script')
        .send({
          replyto: noteId,
          forum: noteId,
          invitation: 'workshop/-/review',
          signatures: ['~Reviewerfirst_Reviewerlast1'],
          readers: ['everyone'],
          writers: ['~Reviewerfirst_Reviewerlast1'],
          content: {
            title: 'this is a review title',
            review: 'this is a review'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + reviewerToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(2);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.length.should.equals(0);
      response.body.invitations[1].id.should.equals('workshop/-/review');
      response.body.invitations[1].duedate.should.equal(2481932799000);
      response.body.invitations[1].should.have.property('details');
      response.body.invitations[1].details.should.have.property('replytoNote');
      response.body.invitations[1].details.replytoNote.invitation.should.equals('workshop/-/submission');
      response.body.invitations[1].details.replytoNote.should.not.have.property('tauthor');
      response.body.invitations[1].details.should.have.property('repliedNotes');
      response.body.invitations[1].details.repliedNotes.should.be.a('array');
      response.body.invitations[1].details.repliedNotes.length.should.equals(1);
      response.body.invitations[1].details.repliedNotes[0].invitation.should.equals('workshop/-/review');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should get pending invitations for an author', function(done) {

    chai.request(server)
    .get('/invitations?invitee=true&duedate=true&details=replytoNote,repliedNotes')
    .set('Authorization', 'Bearer ' + authorToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.should.be.a('array');
      response.body.invitations[0].details.repliedNotes.length.should.equals(1);
      response.body.invitations[0].details.repliedNotes[0].invitation.should.equals('workshop/-/submission');
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + authorToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(0);
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=false&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + authorToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + authorToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['~Authorfirst_Authorlast1'],
          readers: ['everyone'],
          writers: ['~Authorfirst_Authorlast1'],
          content: {
            title: 'this is another title',
            authors: ['Authorfirst Authorlast'],
            description: 'this is another description'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=false&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + authorToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.should.be.a('array');
      response.body.invitations[0].details.repliedNotes.length.should.equals(2);
      response.body.invitations[0].details.repliedNotes[0].invitation.should.equals('workshop/-/submission');
      response.body.invitations[0].details.repliedNotes[1].invitation.should.equals('workshop/-/submission');
      return chai.request(server)
      .get('/invitations?replyForum=' + noteId + '&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/review');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.should.be.a('array');
      response.body.invitations[0].details.repliedNotes.length.should.equals(1);
      response.body.invitations[0].details.repliedNotes[0].forum.should.equals(noteId);
      response.body.invitations[0].details.repliedNotes[0].invitation.should.equals('workshop/-/review');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should get pending invitations for a co-author', function(done) {

    chai.request(server)
    .get('/invitations?invitee=true&duedate=true&details=replytoNote,repliedNotes')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.should.be.a('array');
      response.body.invitations[0].details.repliedNotes.length.should.equals(1);
      response.body.invitations[0].details.repliedNotes[0].invitation.should.equals('workshop/-/submission');
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(0);
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=false&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/submission',
          signatures: ['~Test_User1'],
          readers: ['everyone'],
          writers: ['~Test_User1'],
          content: {
            title: 'this is another title',
            authors: ['Test User'],
            description: 'this is another description'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=false&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.should.be.a('array');
      response.body.invitations[0].details.repliedNotes.length.should.equals(2);
      response.body.invitations[0].details.repliedNotes[0].invitation.should.equals('workshop/-/submission');
      response.body.invitations[0].details.repliedNotes[1].invitation.should.equals('workshop/-/submission');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should get pending referent invitations', function(done) {

    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'workshop/-/revise',
      'signatures': [superUser],
      'writers': [superUser],
      'readers': ['everyone'],
      'nonreaders': [],
      'invitees': ['test@test.com'],
      'noninvitees':[],
      'duedate': 2481932799000,
      'reply' : {
        referent: noteId,
        forum: noteId,
        readers: { 'values-regex': '.+' },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        content: {
          'title': {
            'order': 1,
            'value-regex': '.{0,50}',
            'description': 'title'
          }
        }
      }
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(2);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedNotes');
      response.body.invitations[0].details.repliedNotes.should.be.a('array');
      response.body.invitations[0].details.repliedNotes.length.should.equals(2);
      response.body.invitations[0].details.repliedNotes[0].invitation.should.equals('workshop/-/submission');
      response.body.invitations[0].details.repliedNotes[1].invitation.should.equals('workshop/-/submission');
      response.body.invitations[1].id.should.equals('workshop/-/revise');
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/revise');
      response.body.invitations[0].details.repliedNotes.length.should.equals(0);
      response.body.invitations[0].details.replytoNote.id.should.equal(noteId);
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=false&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/submission');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          referent: noteId,
          invitation: 'workshop/-/revise',
          signatures: ['~Test_User1'],
          readers: ['everyone'],
          writers: ['~Test_User1'],
          content: {
            title: 'this is another title'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/revise');
      response.body.invitations[0].details.repliedNotes.length.should.equals(1);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          referent: noteId,
          invitation: 'workshop/-/revise',
          signatures: ['~Test_User1'],
          readers: ['everyone'],
          writers: ['~Test_User1'],
          content: {
            title: 'this is another title 2'
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&replyto=true&details=replytoNote,repliedNotes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/revise');
      response.body.invitations[0].details.repliedNotes.length.should.equals(2);
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

/*
  it('should get tag invitations with repliedTags', function(done) {

    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': 'workshop/-/Add_Bid',
      'signatures': [superUser],
      'writers': [superUser],
      'readers': ['everyone'],
      'invitees': ['everyone'],
      'duedate': Date.now(),
      multiReply: true,
      'reply' : {
        forum: null,
        replyto: null,
        invitation: 'workshop/-/submission',
        readers: { 'values-regex': '.+' },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        content: {
          tag: {
            order: 1,
            'value-regex': '.{0,50}',
            description: 'title'
          }
        }
      }
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&tags=true&details=repliedTags')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/Add_Bid');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.have.property('repliedTags');
      response.body.invitations[0].details.repliedTags.length.should.equals(0);
      return chai.request(server)
        .post('/tags')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          forum: noteId,
          invitation: 'workshop/-/Add_Bid',
          signatures: ['~Test_User1'],
          readers: ['everyone'],
          tag: 'I want to review'
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
      .get('/invitations?invitee=true&duedate=true&tags=true&details=repliedTags')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.a.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('workshop/-/Add_Bid');
      response.body.invitations[0].should.have.property('details');
      response.body.invitations[0].details.should.not.have.property('replytoNote');
      response.body.invitations[0].details.should.not.have.property('repliedNotes');
      response.body.invitations[0].details.should.have.property('repliedTags');
      response.body.invitations[0].details.repliedTags.should.be.a('array');
      response.body.invitations[0].details.repliedTags.length.should.equals(1);
      response.body.invitations[0].details.repliedTags[0].tag.should.equals('I want to review');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });
*/
/*

  it('should get notes by invitee and duedate, then post a review, then delete the review.', function(done) {
    chai.request(server)
    .get('/notes?invitee=true&duedate=true')
    .set('Authorization', 'Bearer ' + reviewerToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.a.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.a.property('replytoNote');
      result.body.notes[0].should.have.a.property('invitation');
      result.body.notes[0].replytoNote.should.have.a.property('id');
      result.body.notes[0].invitation.should.have.a.property('id');
      result.body.notes[0].invitation.id.should.equal('workshop/-/review');
      result.body.notes[0].replytoNote.should.have.a.property('signatures');
      result.body.notes[0].replytoNote.signatures.should.be.a('array');
      result.body.notes[0].replytoNote.signatures.length.should.equal(1);
      result.body.notes[0].replytoNote.signatures.should.contain('~Authorfirst_Authorlast1');
      result.body.notes[0].replytoNote.should.have.a.property('writers');
      result.body.notes[0].replytoNote.writers.should.be.a('array');
      result.body.notes[0].replytoNote.writers.length.should.equal(1);
      result.body.notes[0].replytoNote.writers.should.contain('~Authorfirst_Authorlast1');
      result.body.notes[0].replytoNote.should.have.a.property('content');
      result.body.notes[0].replytoNote.content.should.have.a.property('authors');
      result.body.notes[0].replytoNote.content.authors.should.be.a('array');
      result.body.notes[0].replytoNote.content.authors.length.should.equal(1);
      result.body.notes[0].replytoNote.content.authors.should.contain('Authorfirst Authorlast');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + reviewerToken)
        .set('User-Agent', 'test-create-script')
        .send({
          replyto: noteId,
          forum: noteId,
          invitation: 'workshop/-/review',
          signatures: ['~Reviewerfirst_Reviewerlast1'],
          readers: ['everyone'],
          writers: ['~Reviewerfirst_Reviewerlast1'],
          content: {
            title: 'this is a review title',
            review: 'this is a review'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      reviewId = result.body.id;
      return chai.request(server)
        .get('/notes?id=' + reviewId)
        .set('Authorization', 'Bearer ' + reviewerToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].should.have.property('tauthor');
      result.body.notes[0].tauthor.should.equal('reviewer@test.com');
      return chai.request(server)
        .get('/notes?invitee=true&duedate=true')
        .set('Authorization','Bearer ' + reviewerToken)
        .set('User-Agent','test-create-script');
    })
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.a.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(0);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + reviewerToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: reviewId,
          ddate: NOW,
          forum: noteId,
          invitation: 'workshop/-/review',
          signatures: ['~Reviewerfirst_Reviewerlast1'],
          readers: ['everyone'],
          writers: ['~Reviewerfirst_Reviewerlast1'],
          content: {
            title: 'this is a review title',
            review: 'this is a review'
          }
        })
    })
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      reviewId = result.body.id;
      return chai.request(server)
        .get('/notes?forum='+noteId+'&trash=true' + reviewId)
        .set('Authorization', 'Bearer ' + authorToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(2);
      // the sort was removed from the query so we need to
      // find the deleted note.
      var idx = 0;
      if (_.isNull(result.body.notes[0].ddate)){
        idx = 1;
      }
      result.body.notes[idx].ddate.should.equal(NOW);
      result.body.notes[idx].should.have.a.property('id');
      result.body.notes[idx].should.have.a.property('signatures');
      result.body.notes[idx].signatures.should.be.a('array')
      result.body.notes[idx].signatures.length.should.equal(0);
      result.body.notes[idx].should.have.a.property('writers');
      result.body.notes[idx].writers.should.be.a('array');
      result.body.notes[idx].writers.length.should.equal(0);
      result.body.notes[idx].should.have.a.property('content');
      result.body.notes[idx].content.should.have.a.property('authors');
      result.body.notes[idx].content.authors.should.be.a('array');
      result.body.notes[idx].content.authors.length.should.equal(0);
      return chai.request(server)
        .get('/notes?invitee=true&duedate=true')
        .set('Authorization','Bearer ' + reviewerToken)
        .set('User-Agent','test-create-script');
    })
    .then(function(result){
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.a.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });
*/

});
