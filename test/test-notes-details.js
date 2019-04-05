var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('NotesDetails', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  let guestToken = '';
  var beforeNow = Date.now();

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

  it('should get notes with all the details', function (done) {
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']});
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'ICC.cc/-/submission',
          signatures: ['~Test_User1'],
          writers: ['~Test_User1'],
          readers: ['everyone'],
          content: {
            title: 'Paper title 1',
            abstract: 'The abstract of test paper 1',
            authors: ['Melisa Bok', 'Michael Spector'],
            authorids: ['mbok@mail.com', 'spector@mail.com']
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
        .get('/notes?details=all')
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.notes.length.should.equals(1);
      response.body.notes[0].should.have.property('details');
      response.body.notes[0].details.should.have.property('replyCount');
      response.body.notes[0].details.replyCount.should.equals(0);
      response.body.notes[0].details.should.have.property('tags');
      response.body.notes[0].details.tags.should.eql([]);
      response.body.notes[0].details.should.not.have.property('original');
      response.body.notes[0].details.should.have.property('revisions');
      response.body.notes[0].details.revisions.should.equals(false);
      response.body.notes[0].details.should.have.property('writable');
      response.body.notes[0].details.writable.should.equals(false);
      response.body.notes[0].details.should.have.property('overwriting');
      response.body.notes[0].details.overwriting.should.eql([]);
      response.body.notes[0].details.should.not.have.property('forumContent');
      return chai.request(server)
        .get('/notes')
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.notes.length.should.equals(1);
      response.body.notes[0].should.not.have.property('details');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

});



