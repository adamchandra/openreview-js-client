'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

chai.use(chaiHttp);

// This tests that any links to the legacy system of open review resolve
// correctly after the data is migrated to the current system.
describe('Legacy Redirect', function () {

  var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var conference = 'MCZ';
  // note: the lookup for the /document/ end point is implemented
  // with a hard-coded dictionary lookup, so these values have to
  // be real from the legacy system.
  var legacyPDFid = '911403f1-c6ec-4d9b-95d8-c954bcef61e8.pdf';
  var legacyDocid = 'c7956204-21c4-493d-9bd0-f2e5502cd414';
  var forum;

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

  it('should create a note', function (done) {
    utils.createGroup(conference, superUser, superToken, ['everyone'], function () {
      utils.createInvitation(conference + '/-/submission', conference, superToken, {}, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': conference + '/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'SHOULD SUCCEED 1',
            'abstract': 'The abstract of test paper 1',
            'authors': 'Test User',
            'author_emails': 'test@host.com',
            'pdf':  '/pdf/' + legacyPDFid
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          forum = res.body.id;
          done();
        });
      });
    });
  });

  it('should redirect to pdf URL', function (done) {
    chai.request(server)
    .get('/file/' + legacyPDFid )
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.redirects.should.be.a('array');
      res.redirects.length.should.equal(1);
      var url = res.redirects[0].split('pdf?id=');
      url[1].should.equal(forum);
      done();
    });
  });

  it('should redirect to homepage when no PDF specified', function (done) {
    chai.request(server)
    .get('/file/')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.redirects.should.be.a('array');
      res.redirects.length.should.equal(1);
      res.redirects[0].should.equal(utils.server + '/');
      done();
    });
  });


  it('should redirect to forum URL', function (done) {
    chai.request(server)
    .get('/document/' + legacyDocid)
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.redirects.should.be.a('array');
      res.redirects.length.should.equal(1);
      var url = res.redirects[0].split('forum?id=');
      url[1].should.equal(forum);
      done();
    });
  });

  it('should get an error when an unkown document id', function (done) {
    chai.request(server)
    .get('/document/11')
    .set('Authorization', 'Bearer ' + superToken)
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
      res.body.errors[0].should.equal('Forum not found');
      done();
    });
  });

  it('should redirect to homepage when no document specified', function (done) {
    chai.request(server)
    .get('/document/')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.redirects.should.be.a('array');
      res.redirects.length.should.equal(1);
      res.redirects[0].should.equal(utils.server + '/');
      done();
    });
  });

  it('should redirect to home page', function (done) {
    chai.request(server)
    .get('/venue/')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.redirects.should.be.a('array');
      res.redirects.length.should.equal(1);
      res.redirects[0].should.equal(utils.server + '/');
      done();
    });
  });

});
