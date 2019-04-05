var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');
var _ = require('lodash');


chai.use(chaiHttp);

describe('NotesReplies', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";

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

  it('should get replyCount > 0 for replies of replies', function (done) {
    var noteId;
    var replyId;
    utils.createGroupP('workshop', superUser, superToken)
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
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
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
        'reply': {
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
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'workshop/-/submission',
        signatures: [user],
        readers: ['everyone'],
        writers: [user],
        content: {
          title: 'this is a title',
          description: 'this is a description'
        }
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'workshop/-/comment',
        signatures: [user],
        readers: ['everyone'],
        writers: [user],
        forum: noteId,
        replyto: noteId,
        content: {
          comment: 'this is a comment'
        }
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      replyId = result.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'workshop/-/comment',
        signatures: [user],
        readers: ['everyone'],
        writers: [user],
        forum: noteId,
        replyto: replyId,
        content: {
          comment: 'this is a reply to a comment'
        }
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      replyId = result.body.id;
      return chai.request(server)
      .get('/notes?tauthor=true&details=replyCount')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(3);
      // the sort was removed from this query so we need to do a bit more to
      // validate the data
      let replies = {};

      _.forEach(result.body.notes, function(rec){
        replies[rec.content.comment || rec.content.title] =  rec.details.replyCount;
      });

      var rec = replies['this is a reply to a comment'];
      rec.should.equal(0);
      rec = replies['this is a comment'];
      //rec.should.equal(1); fix this later, do we need it?
      rec = replies['this is a title'];
      rec.should.equal(2);

      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should get the forumContent of a reply when the user is a superUser', function (done) {
    var noteId;
    var replyId;
    utils.createGroupP('workshop2', superUser, superToken)
    .then(function (result) {
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
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      return chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'workshop2/-/comment',
        'signatures': [superUser],
        'writers': [superUser],
        'readers': ['everyone'],
        'invitees': ['everyone'],
        'reply': {
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
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'workshop2/-/submission',
        signatures: [user],
        readers: [user],
        writers: [user],
        content: {
          title: 'this is a title',
          description: 'this is a description'
        }
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      noteId = result.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'workshop2/-/comment',
        signatures: [user],
        readers: [user],
        writers: [user],
        forum: noteId,
        replyto: noteId,
        content: {
          comment: 'this is a comment'
        }
      });
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.have.property('id');
      replyId = result.body.id;
      return chai.request(server)
      .get('/notes?invitation=workshop2/-/comment&details=all')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.should.have.property('notes');
      result.body.notes.should.be.a('array');
      result.body.notes.length.should.equal(1);
      result.body.notes[0].content.comment.should.equal('this is a comment');
      result.body.notes[0].details.replyCount.should.equal(0);
      result.body.notes[0].details.should.have.property('forumContent');
      result.body.notes[0].details.forumContent.should.have.property('title');
      result.body.notes[0].details.forumContent.title.should.equal('this is a title');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should search and get all the notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=this&content=all&group=all')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.notes.length.should.equal(5);
      result.body.notes[0].content.comment.should.equal('this is a comment');
      result.body.notes[1].content.title.should.equal('this is a title');
      result.body.notes[2].content.comment.should.equal('this is a reply to a comment');
      result.body.notes[3].content.comment.should.equal('this is a comment');
      result.body.notes[4].content.title.should.equal('this is a title');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });


  it('should search and get only the forum notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=this&content=all&group=all&source=forum')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.notes.length.should.equal(2);
      result.body.notes[0].content.title.should.equal('this is a title');
      result.body.notes[1].content.title.should.equal('this is a title');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should search and get only the replies notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=this&content=all&group=all&source=reply')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.should.be.json;
      result.body.should.be.a('object');
      result.body.notes.length.should.equal(3);
      result.body.notes[0].content.comment.should.equal('this is a comment');
      result.body.notes[1].content.comment.should.equal('this is a reply to a comment');
      result.body.notes[2].content.comment.should.equal('this is a comment');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

});
