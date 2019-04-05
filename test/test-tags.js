'use strict';
var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

var expect = chai.expect;
chai.should();
chai.use(chaiHttp);


describe('Tags', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  var validBidValue = "yes";

  before(function (done) {
    utils.setUp(function (aSuperToken, aTestToken) {
      superToken = aSuperToken;
      testToken = aTestToken;
      done();
    });
  });

  var abcToken = null;
  before(function (done) {
    utils.createAndLoginUser("abc@test.com", "abc", "test")
    .then(function (token) {
      abcToken = token;
      done();
    });
  });

  after(function (done) {
    utils.tearDown(done);
  });

  // helper functions

  var createTagInvitationP = function (id, user, token, content, readers, multiReply, taskCompletionCount, writers, signatures, nonreaders, invitees) {
    return chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + token)
    .set('User-Agent', 'test-create-script')
    .send({
      'id': id,
      'signatures': [user],
      'writers': [user],
      'invitees': (invitees !== undefined) ? invitees : ['~'],
      'readers': ['everyone'],
      'nonreaders': [],
      'multiReply': (multiReply !== undefined) ? multiReply : null,
      'taskCompletionCount': (taskCompletionCount !== undefined) ? taskCompletionCount : 0,
      'reply': {
        invitation: 'MCZ.cc/-/submission',
        readers: (readers !== undefined) ? readers : {values: ['everyone']},
        signatures: (signatures !== undefined) ? signatures : {'values-regex': '.+'},
        writers: (writers !== undefined) ? writers : {'values-regex': '.+'},
        nonreaders: (nonreaders !== undefined) ? nonreaders : {'values-regex': '.*'},
        content: content
      }
    });
  };


  var createTagInvitation = function (id, user, token, content, readers, multiReply, taskCompletionCount, done) {
    createTagInvitationP(id, user, token, content, readers, multiReply, taskCompletionCount)
    .end(function (err, res) {
      if (res.status !== 200) {
        console.log("Invitation error: ", res);
      }
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(id);
      done();
    });
  };

  let confid = 'MCZ.cc';
  let reviewerGroup = confid + '/Reviewers';

  // for testing, no spaces only 40 characters
  var text_tag_content = {
    "tag": {
      "required": true,
      "value-regex": "[\\S]{1,40}",
      "description": "Free form text."
    }
  };

  var reviewer_tag_content = {
    "tag": {
      "required": true,
      "values-url": "/group?id=" + reviewerGroup,
      "description": "Suggested reviewer for a paper."
    }
  };

  var bids_tag_content = {
    "tag": {
      "required": true,
      "value-radio": [
        validBidValue,
        "no",
        "maybey"
      ],
      "description": "Reviewer's bid for a paper."
    }
  };

  let tagid_1 = 'mcztest';
  let forumName_1 = 'testforum';
  let forumName_2 = 'testforum2';
  let forumId_1 = undefined;
  let forumId_2 = undefined;
  let forum = 'MCZForum';
  let replyto = 'i_do_not_exist_yet';
  let validInvitationFreeTextId = confid + '/-/FreeTextTag';
  let validInvitationFreeTextIdMultiReply = confid + '/-/FreeTextTagMultiReply';
  let invalidInvitationMissingMultiReplyId = confid + '/-/MissingMultiReply';
  let invalidInvitationNonBoolMultiReplyId = confid + '/-/NonBooleanMultiReply';
  let validReviewer = '~First_Reviewer1';
  let noteInvitation = confid + '/-/submission';

  it('should create new forum', function (done) {
    utils.createGroup(confid, superUser, superToken, ['everyone'], function () {
      utils.createInvitation(noteInvitation, confid, superToken, {}, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': noteInvitation,
          'forum': forumName_1,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'test',
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
          forumId_1 = res.body.id;
          done();
        });
      });
    });
  });

  it('should not create new tag without an invitation', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_1,
      'signatures': [user],
      'forum': forumId_1,
      'readers': [user]
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('missing');
      res.body.errors[0].path.should.equal('invitation');
      done();
    });
  });

  it('should not create new tag without a valid invitation', function (done) {
    let invitationId = 'i-do-not-exist';
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_1,
      'signatures': [user],
      'readers': [user],
      'forum': forumId_1,
      'invitation': invitationId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      res.body.errors[0].path.should.equal('invitation');
      res.body.errors[0].value.should.equal(invitationId);
      done();
    });
  });

  it('should create invitation w/o MultiReply', function (done) {
    utils.createGroupWithMembers(reviewerGroup, superUser, superToken, [validReviewer, '~Second_Reviewer1'], [validReviewer, '~Second_Reviewer1'], function () {
      utils.createInvitation(invalidInvitationMissingMultiReplyId, confid, superToken, text_tag_content, {values: ['everyone']}, function () {
        done();
      });
    });
  });

  it('should not create tag without "multiReply" field in invitation', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': 'abc',
      'signatures': [user],
      'readers': [user],
      'forum': forumId_1,
      'invitation': invalidInvitationMissingMultiReplyId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notBoolean');
      res.body.errors[0].path.should.equal('multiReply');
      done();
    });
  });

  it('should create invitation with non-boolean MultiReply value', function (done) {
    createTagInvitation(invalidInvitationNonBoolMultiReplyId, confid, superToken, text_tag_content, {values: ['everyone']}, null, 0, function () {
      done();
    });
  });

  //TODO: move this validation to the invitation service not in the tag creation.
  it('should not create tag with "multiReply" field non-boolean value ', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': 'abc',
      'signatures': [user],
      'readers': [user],
      'forum': forumId_1,
      'invitation': invalidInvitationNonBoolMultiReplyId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notBoolean');
      res.body.errors[0].path.should.equal('multiReply');
      done();
    });
  });

  it('should create invitation for free form text tags, multiReply is FALSE', function (done) {
    createTagInvitation(validInvitationFreeTextId, confid, superToken, text_tag_content, {values: ['everyone']}, false, 0, function () {
      done();
    });
  });


  it('should not create new tag without a tag field', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'signatures': [user],
      'forum': forumName_1,
      'readers': [user],
      'invitation': validInvitationFreeTextId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('missing');
      res.body.errors[0].path.should.equal('tag');
      done();
    });
  });


  it('should not create new tag with spaces in tag text', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': 'a b c',
      'signatures': [user],
      'readers': [user],
      'forum': forumId_1,
      'invitation': validInvitationFreeTextId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('tag');
      done();
    });
  });

  it('should not create new tag with long tag text', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': 'aReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyReallyLongTag',
      'signatures': [user],
      'readers': [user],
      'forum': forumId_1,
      'invitation': validInvitationFreeTextId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('tag');
      done();
    });
  });

  it('should not create new tag without a signatory', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_1,
      'signatures': [],
      'readers': [user],
      'invitation': validInvitationFreeTextId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notSignatory');
      res.body.errors[0].path.should.equal('signatures');
      done();
    });
  });

  it('should not create new tag without a forum id', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_1,
      'signatures': [user],
      'readers': [user],
      'invitation': validInvitationFreeTextId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('missing');
      res.body.errors[0].path.should.equal('forum');
      done();
    });
  });


  it('should not create tag for a forum that does not exist', function (done) {
    let bad_forum = 'i_do_not_exist';
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_1,
      'signatures': [user],
      'readers': [user],
      'forum': bad_forum,
      'invitation': validInvitationFreeTextId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      res.body.errors[0].path.should.equal('id');
      res.body.errors[0].value.should.equal(bad_forum);
      done();
    });
  });


  var existing_tag_multireply_false = {};

  it('should create new tag for a forum', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_1,
      'signatures': [user],
      'readers': [user],
      'invitation': validInvitationFreeTextId,
      'forum': forumId_1
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(tagid_1);
      res.body.forum.should.equal(forumId_1);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.tauthor.should.equal(user);
      existing_tag_multireply_false = res.body;
      done();
    });
  });

  var tagid_2 = 'second_tag';

  it('should not create second tag for a forum when invitation has multiReply = FALSE', function (done) {

    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_2,
      'signatures': [user],
      'readers': [user],
      'invitation': validInvitationFreeTextId,
      'forum': forumId_1
    })
    .then(function (res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('tooMany');
      res.body.errors[0].path.should.equal('Tag: ' + tagid_2);
      res.body.errors[0].value.should.equal('Forum: ' + forumId_1);
      return createTagInvitationP(validInvitationFreeTextId + '2', confid, superToken, text_tag_content, {values: ['everyone']}, false, 0);
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/tags')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'tag': tagid_2,
        'signatures': [user],
        'readers': [user],
        'invitation': validInvitationFreeTextId + '2',
        'forum': forumId_1
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      return chai.request(server)
      .post('/tags')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': res.body.id,
        'ddate': Date.now(),
        'tag': tagid_2,
        'signatures': [user],
        'readers': [user],
        'invitation': validInvitationFreeTextId + '2',
        'forum': forumId_1
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });


  it('should get tags by forum and return one tag', function (done) {
    chai.request(server)
    .get('/tags?forum=' + forumId_1)
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.tags.length.should.equal(1);
      res.body.tags[0].should.have.property('signatures');
      res.body.tags[0].signatures.length.should.equal(1);
      res.body.tags[0].signatures[0].should.equal(user);
      res.body.tags[0].tag.should.equal(tagid_1);
      done();
    });
  });

  var deleteThisTag = {};
  it('should update tag even if multiReply is FALSE', function (done) {
    let updateTagText = 'i_have_changed';
    existing_tag_multireply_false.tag = updateTagText;
    existing_tag_multireply_false.mdate = Date.now();
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send(existing_tag_multireply_false)
    .end(function (error, res) {
      res.should.have.status(200);
      deleteThisTag = res.body;
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(existing_tag_multireply_false.id);
      res.body.should.have.property('tag');
      res.body.tag.should.equal(updateTagText);
      res.body.forum.should.equal(forumId_1);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.should.have.property('tcdate');
      res.body.should.have.property('tmdate');
      res.body.tauthor.should.equal(user);
      expect(res.body.tcdate).to.be.below(res.body.tmdate);
      done();
    });
  });


  it('should delete tag with multiReply = FALSE', function (done) {
    deleteThisTag.ddate = Date.now();
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send(deleteThisTag)
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(deleteThisTag.id);
      res.body.should.have.property('tag');
      res.body.tag.should.equal(deleteThisTag.tag);
      res.body.forum.should.equal(forumId_1);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.should.have.property('tcdate');
      res.body.should.have.property('tmdate');
      res.body.should.have.property('ddate');
      expect(res.body.tcdate).to.be.below(res.body.tddate);
      done();
    });
  });


  it('should get tags by forum and return zero tags', function (done) {
    chai.request(server)
    .get('/tags?forum=' + forumId_1)
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.tags.length.should.equal(0);
      done();
    });
  });

  let tagText = 'i_am_new';
  it('should create new tag for a forum with multiReply = FALSE, ignoring the deleted tag', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagText,
      'signatures': [user],
      'readers': [user],
      'invitation': validInvitationFreeTextId,
      'forum': forumId_1
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(tagText);
      res.body.forum.should.equal(forumId_1);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.tauthor.should.equal(user);
      done();
    });
  });

  it('should get tags by forum and return one tag', function (done) {
    chai.request(server)
    .get('/tags?forum=' + forumId_1)
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.tags.length.should.equal(1);
      res.body.tags[0].should.have.property('signatures');
      res.body.tags[0].signatures.length.should.equal(1);
      res.body.tags[0].signatures[0].should.equal(user);
      res.body.tags[0].tag.should.equal(tagText);
      done();
    });
  });

  it('should create invitation with multiReply TRUE', function (done) {
    createTagInvitation(validInvitationFreeTextIdMultiReply, confid, superToken, text_tag_content, {values: ['everyone']}, true, 0, function () {
      done();
    });
  });

  var tagid_3 = 'third_tag';

  it('should create new tag for a replyto note', function (done) {

    // first create a note for the forum
    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': noteInvitation,
      'forum': forumName_2,
      'parent': null,
      'signatures': ['~Super_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'content': {
        'title': 'test',
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
      replyto = res.body.id;
      forumId_2 = res.body.id;
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      return chai.request(server)
      .post('/tags')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'tag': tagid_3,
        'signatures': [user],
        'readers': [user],
        'forum': forumId_2,
        'invitation': validInvitationFreeTextIdMultiReply,
        'replyto': replyto
      })
      .end(function (error, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.should.have.property('tag');
        res.body.should.have.property('replyto');
        res.body.replyto.should.equal(replyto);
        res.body.tag.should.equal(tagid_3);
        res.body.forum.should.equal(forumId_2);
        res.body.should.have.property('signatures');
        res.body.signatures.length.should.equal(1);
        res.body.signatures[0].should.equal(user);
        res.body.tcdate.should.equal(res.body.tmdate);
        done();
      });
    });
  });

  // add 2nd tag to same forum
  var tagid_4 = 'fourth_tag';

  it('should create second tag for a forum when invitation has multiReply = TRUE', function (done) {

    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tagid_4,
      'signatures': [user],
      'readers': [user],
      'forum': forumId_2,
      'invitation': validInvitationFreeTextIdMultiReply
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(tagid_4);
      res.body.forum.should.equal(forumId_2);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.tauthor.should.equal(user);
      done();
    });
  });

  let existingTag = {};

  it('get tag by note (replyto)', function (done) {
    chai.request(server)
    .get('/tags?replyto=' + replyto)
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.tags.length.should.equal(1);
      res.body.tags[0].should.have.property('id');
      res.body.tags[0].should.have.property('signatures');
      res.body.tags[0].signatures.length.should.equal(1);
      res.body.tags[0].signatures[0].should.equal(user);
      res.body.tags[0].replyto.should.equal(replyto);
      existingTag = res.body.tags[0];
      done();
    });
  });

  let updateTagText = 'new_tag_text';
  it('should update tag', function (done) {
    existingTag.tag = updateTagText;
    existingTag.mdate = Date.now();
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send(existingTag)
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(existingTag.id);
      res.body.should.have.property('tag');
      res.body.should.have.property('replyto');
      res.body.replyto.should.equal(replyto);
      res.body.tag.should.equal(updateTagText);
      res.body.forum.should.equal(forumId_2);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.should.have.property('tcdate');
      res.body.should.have.property('tmdate');
      res.body.tauthor.should.equal(user);
      expect(res.body.tcdate).to.be.below(res.body.tmdate);
      done();
    });
  });

  it('should still get two tags for a forum', function (done) {
    chai.request(server)
    .get('/tags?forum=' + forumId_2)
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.tags.length.should.equal(2);
      res.body.tags[0].should.have.property('signatures');
      res.body.tags[0].signatures.length.should.equal(1);
      res.body.tags[0].signatures[0].should.equal(user);
      // query sorts by tcdate so we know the order they should come back in
      res.body.tags[0].tag.should.equal(updateTagText);
      res.body.tags[1].tag.should.equal(tagid_4);
      done();
    });
  });

  it('should delete tag', function (done) {
    existingTag.ddate = Date.now();
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send(existingTag)
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(existingTag.id);
      res.body.should.have.property('tag');
      res.body.should.have.property('replyto');
      res.body.replyto.should.equal(replyto);
      res.body.tag.should.equal(updateTagText);
      res.body.forum.should.equal(forumId_2);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.should.have.property('tcdate');
      res.body.should.have.property('tmdate');
      res.body.should.have.property('ddate');
      expect(res.body.tcdate).to.be.below(res.body.tddate);
      done();
    });
  });

  it('should only get one tag for a forum - ignore deleted tag', function (done) {
    chai.request(server)
    .get('/tags?forum=' + forumId_2)
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.tags.length.should.equal(1);
      res.body.tags[0].should.have.property('signatures');
      res.body.tags[0].signatures.length.should.equal(1);
      res.body.tags[0].signatures[0].should.equal(user);
      res.body.tags[0].tag.should.equal(tagid_4);
      done();
    });
  });

  it('should get tags by invitation', function (done) {
    chai.request(server)
    .get('/tags?invitation=unknown' )
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(result) {
      result.should.have.status(200);
      result.body.tags.length.should.equal(0);
      return chai.request(server)
      .get('/tags')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.tags.length.should.equal(2);
      result.body.tags[0].invitation.should.equals('MCZ.cc/-/FreeTextTagMultiReply');
      result.body.tags[1].invitation.should.equals('MCZ.cc/-/FreeTextTag');
      return chai.request(server)
      .get('/tags?invitation=MCZ.cc/-/FreeTextTagMultiReply')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.tags.length.should.equal(1);
      result.body.tags[0].invitation.should.equals('MCZ.cc/-/FreeTextTagMultiReply');
      return chai.request(server)
      .get('/tags?invitation=MCZ.cc/-/FreeTextTag.*')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(result) {
      result.should.have.status(200);
      result.body.tags.length.should.equal(2);
      result.body.tags[0].invitation.should.equals('MCZ.cc/-/FreeTextTagMultiReply');
      result.body.tags[1].invitation.should.equals('MCZ.cc/-/FreeTextTag');
      done();
    })
    .catch(error => done(error));
  });


  updateTagText = 'newer_tag_text';
  it('should update tag as different author', function (done) {
    existingTag.tag = updateTagText;
    existingTag.mdate = Date.now();
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send(existingTag)
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal(existingTag.id);
      res.body.should.have.property('tag');
      res.body.should.have.property('replyto');
      res.body.replyto.should.equal(replyto);
      res.body.tag.should.equal(updateTagText);
      res.body.forum.should.equal(forumId_2);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.should.have.property('tcdate');
      res.body.should.have.property('tmdate');
      expect(res.body.tcdate).to.be.below(res.body.tmdate);
      res.body.tauthor.should.equal(superUser);
      done();
    });
  });

  let validInvitationBidId = confid + '/-/bid';

  it('should create invitation for bid tags', function (done) {
    createTagInvitation(validInvitationBidId, confid, superToken, bids_tag_content, {values: ['everyone']}, true, 0, function () {
      done();
    });
  });


  it('should not create new tag with invalid value', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': 'invalid',
      'signatures': [user],
      'readers': [user],
      'forum': forumId_2,
      'invitation': validInvitationBidId
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('tag');
      done();
    });
  });


  it('should create new tag with valid value', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': validBidValue,
      'signatures': [user],
      'readers': [user],
      'invitation': validInvitationBidId,
      'forum': forumId_2
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(validBidValue);
      res.body.forum.should.equal(forumId_2);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.tauthor.should.equal(user);
      done();
    });
  });

  let validInvitationReviewerId = confid + '/-/rev';

  it('should create invitation for reviewer', function (done) {
    createTagInvitation(validInvitationReviewerId, confid, superToken, reviewer_tag_content, {values: ['everyone']}, true, 0, function () {
      done();
    });
  });


  it('should not create new tag with invalid value for reviewer', function (done) {
    var invalidUser = 'invalid';
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': invalidUser,
      'signatures': [user],
      'readers': [user],
      'invitation': validInvitationReviewerId,
      'forum': forumId_2
    })
    .end(function (error, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('Not Found');
      res.body.errors[0].path.should.equal(reviewerGroup);
      res.body.errors[0].value.should.equal(invalidUser);
      done();
    });
  });


  it('should create new tag with valid value for reviewer', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': validReviewer,
      'signatures': [user],
      'readers': ['everyone'],
      'invitation': validInvitationReviewerId,
      'forum': forumId_2
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(validReviewer);
      res.body.forum.should.equal(forumId_2);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(user);
      res.body.tauthor.should.equal(user);
      done();
    });
  });


  it('should get all the tag invitations and get a non empty result', function (done) {
    chai.request(server)
    .get('/invitations?tags=true')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(7);
      return chai.request(server)
      .get('/invitations?tags=false')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('MCZ.cc/-/submission');
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
      response.body.invitations.length.should.equal(1);
      response.body.invitations[0].id.should.equals('MCZ.cc/-/submission');
      return chai.request(server)
      .get('/invitations?replyInvitation=MCZ.cc/-/submission')
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
      .get('/invitations?replyInvitation=MCZ.cc/-/submission&tags=true')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(6);
      response.body.invitations[0].id.should.equals('MCZ.cc/-/rev');
      response.body.invitations[1].id.should.equals('MCZ.cc/-/bid');
      response.body.invitations[2].id.should.equals('MCZ.cc/-/FreeTextTagMultiReply');
      response.body.invitations[3].id.should.equals('MCZ.cc/-/FreeTextTag2');
      response.body.invitations[4].id.should.equals('MCZ.cc/-/FreeTextTag');
      response.body.invitations[5].id.should.equals('MCZ.cc/-/NonBooleanMultiReply');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should get a note with tags', function (done) {
    chai.request(server)
    .get('/notes?invitation=' + noteInvitation + '&details=tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].should.have.property('details');
      res.body.notes[0].details.should.have.property('tags');
      res.body.notes[0].details.tags.length.should.equals(3);
      res.body.notes[0].details.tags[0].tauthor.should.equal('test@test.com');
      res.body.notes[0].details.tags[1].tauthor.should.equal('test@test.com');
      res.body.notes[0].details.tags[2].tauthor.should.equal('test@test.com');
      res.body.notes[1].should.have.property('details');
      res.body.notes[1].details.should.have.property('tags');
      res.body.notes[1].details.tags.length.should.equals(1);
      res.body.notes[1].details.tags[0].tauthor.should.equal('test@test.com');
      chai.request(server)
      .get('/notes?invitation=' + noteInvitation + '&details=tags')
      .set('User-Agent', 'test-create-script')
      .end(function (error, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('notes');
        res.body.notes.length.should.equal(2);
        res.body.notes[0].should.have.property('details');
        res.body.notes[0].details.should.have.property('tags');
        res.body.notes[0].details.tags.length.should.equals(1);
        res.body.notes[0].details.tags[0].should.not.have.property('tauthor');
        res.body.notes[1].should.have.property('details');
        res.body.notes[1].details.should.have.property('tags');
        res.body.notes[1].details.tags.length.should.equals(0);
        done();
      });
    });
  });


  it('should create a tag with an expired invitaiton and get an error', function (done) {
    let invitation;
    chai.request(server)
    .get('/invitations?id=MCZ.cc/-/FreeTextTagMultiReply')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.length.should.equal(1);
      invitation = response.body.invitations[0];
      invitation.expdate = Date.now() - 3000;
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
      .post('/tags')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'tag': 'text',
        'signatures': [user],
        'readers': [user],
        'invitation': invitation.id,
        'forum': forumId_2
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
      response.body.errors[0].value.should.equal(invitation.id);
      return chai.request(server)
      .post('/tags')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'tag': 'text',
        'signatures': [user],
        'readers': [user],
        'invitation': invitation.id,
        'forum': forumId_2
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });


  it('should execute a process function when the tag is created', function (done) {

    var tagId;
    var log = function() {
      console.log('Process function: ' + note.id);
      done();
    }

    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: confid + '/-/Tag_Process',
      signatures: [superUser],
      writers: [superUser],
      invitees: ['~'],
      readers: ['everyone'],
      nonreaders: [],
      multiReply: true,
      reply: {
        readers: {values: ['everyone']},
        signatures: {'values-regex': '.+'},
        writers: {'values-regex': '.+'},
        content: {
          tag: {
            required: true,
            'value-regex': "[\\S]{1,40}",
            description: "Free form text."
          }
        }
      },
      process: log + ''
    })
    .then(function (res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/tags')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'tag': 'text',
        'signatures': [user],
        'readers': [user],
        'invitation': confid + '/-/Tag_Process',
        'forum': forumId_2
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      tagId = res.body.id;
      return chai.request(server)
      .get('/tags?id=' + tagId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      return chai.request(server)
      .get('/logs/process?id=' + tagId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.logs.length.should.equal(1);
      res.body.logs[0].status.should.equal('ok');
      res.body.logs[0].log.length.should.equal(2);
      res.body.logs[0].log[0].should.equal('DEBUG: Process function: ' + tagId);
      res.body.logs[0].log[1].should.equal('INFO: DONE');
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });
});
