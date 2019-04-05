var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

chai.should();
chai.use(chaiHttp);

describe('SubmissionsGet', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  let guestToken = '';

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

  it('should create notes by invitation', function (done) {
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']});
    })
    .then(function(response) {
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
      return chai.request(server)
      .get('/submissions?id=ICC.cc')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.html;
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

});
