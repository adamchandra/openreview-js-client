var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

chai.should();
chai.use(chaiHttp);

describe('Pdfs', function () {

  var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var user = 'test@test.com';

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

  it('should get a pdf from an external url', function (done) {
    var noteId;
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']}, function () {
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
            'title': 'Test paper 1',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'authorids': ['test@host.com'],
            'conflicts': 'umass.edu',
            'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          noteId = res.body.id;
          res.body.content.pdf.should.equals('http://arxiv.org/pdf/1506.03425v1.pdf');
          chai.request(server)
          .get('/pdf?id=' + noteId)
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(200);
            res.should.have.header('content-type');
            res.header['content-type'].should.be.equal('application/pdf');
            res.redirects.should.be.a('array');
            res.redirects.length.should.equal(2);
            res.redirects[0].should.equal('http://arxiv.org/pdf/1506.03425v1.pdf');
            res.redirects[1].should.equal('https://arxiv.org/pdf/1506.03425v1.pdf');
            done();
          });
        });
      });
    });
  });

  it('should attempt to post a pdf from an external URL, but fail because it does not match the regex', function (done) {
    var noteId;
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, {'pdf': {'value-regex': 'upload|http(s)?:\/\/.+'}}, {values: ['everyone']}, function () {
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
            'title': 'Test paper 1',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'authorids': ['test@host.com'],
            'conflicts': 'umass.edu',
            'pdf': 'arxiv.org/pdf/1506.03425v1.pdf'
          }
        })
        .end(function (err, res) {
          res.should.have.status(400);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.name.should.equal('error');
          res.body.should.have.property('errors');
          res.body.errors.should.be.a('array');
          res.body.errors.length.should.equals(1);
          res.body.errors[0].type.should.equals('notMatch');
          res.body.errors[0].path.should.equals('content.pdf');
          res.body.errors[0].value.should.equals('arxiv.org/pdf/1506.03425v1.pdf');
          res.body.errors[0].path2.should.equals('invitation.reply.content.pdf[\'value-regex\']');
          res.body.errors[0].value2.should.equals('upload|http(s)?://.+');
          done();
        });
      });
    });
  })


  it('should get a pdf of a deleted note from an external url and get an error', function (done) {
    var noteId;
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'ddate': Date.now(),
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'Test paper 2',
            'abstract': 'The abstract of test paper 2',
            'authors': ['Test User.'],
            'authorids': ['test@host.com'],
            'conflicts': 'umass.edu',
            'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          noteId = res.body.id;
          res.body.content.pdf.should.equals('http://arxiv.org/pdf/1506.03425v1.pdf');
          chai.request(server)
          .get('/pdf?id=' + noteId)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(404);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('status');
            res.body.should.have.property('name');
            res.body.should.have.property('message');
            res.body.message.should.equals('Not Found');
            done();
          });
        });
      });
    });
  });

  it('should get a pdf of a non existent note get an error', function (done) {
    chai.request(server)
    .get('/pdf?id=kkkk')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function(err, res) {
      res.should.have.status(404);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('status');
      res.body.should.have.property('name');
      res.body.should.have.property('message');
      res.body.message.should.equals('Not Found');
      done();
    });
  });

  it('should get a pdf from a local file', function (done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function (response) {
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['~Test_User1']});
    })
    .then(function (response) {
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
        'readers': ['~Test_User1'],
        'content': {
          'title': 'Test paper 3',
          'abstract': 'The abstract of test paper 3',
          'authors': ['Test User 3'],
          'authorids': ['test@host.com'],
          'conflicts': 'umass.edu',
          'pdf': '/pdf/paper.pdf'
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
      res.body.content.pdf.should.equals('/pdf/paper.pdf');
      return chai.request(server)
      .get('/pdf?id=' + noteId)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type');
      res.header['content-type'].should.be.equal('application/pdf');
      res.should.have.header('content-disposition');
      res.header['content-disposition'].should.be.equal('inline; filename=paper.pdf');
      res.should.have.header('content-length');
      return chai.request(server)
      .get('/pdf?id=' + noteId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type');
      res.header['content-type'].should.be.equal('application/pdf');
      res.should.have.header('content-disposition');
      res.header['content-disposition'].should.be.equal('inline; filename=paper.pdf');
      res.should.have.header('content-length');
      return chai.request(server)
      .get('/pdf/paper.pdf')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type');
      res.header['content-type'].should.be.equal('application/pdf');
      res.should.have.header('content-disposition');
      res.header['content-disposition'].should.be.equal('inline; filename=paper.pdf');
      res.should.have.header('content-length');
      chai.request(server)
      .get('/pdf?id=' + noteId)
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('status');
        res.body.should.have.property('name');
        res.body.should.have.property('message');
        res.body.message.should.equals('Forbidden');
        chai.request(server)
        .get('/pdf/paper.pdf')
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(404);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.should.have.property('name');
          res.body.should.have.property('message');
          res.body.message.should.equals('Paper not found');
          done();
        });
      });
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should get a non existent local pdf and get an error', function (done) {
    var noteId;
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']}, function () {
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
            'title': 'Test paper 4',
            'abstract': 'The abstract of test paper 4',
            'authors': ['Test User.'],
            'authorids': ['test@host.com'],
            'conflicts': 'umass.edu',
            'pdf': '/pdf/paper2.pdf'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          noteId = res.body.id;
          res.body.content.pdf.should.equals('/pdf/paper2.pdf');
          chai.request(server)
          .get('/pdf?id=' + noteId)
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(500);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('status');
            res.body.should.have.property('name');
            res.body.name.should.equals('File not found');
            done();
          });
        });
      });
    });
  });

  it('should get a pdf of a note without a pdf field and get an error', function (done) {
    var noteId;
    utils.createGroup('ICC.cc', superUser, superToken, ['everyone'], function () {
      utils.createInvitation('ICC.cc/-/submission', 'ICC.cc', superToken, {}, {values: ['everyone']}, function () {
        chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'ddate': Date.now(),
          'invitation': 'ICC.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            'title': 'Test paper 5',
            'abstract': 'The abstract of test paper 5',
            'authors': ['Test User.'],
            'authorids': ['test@host.com'],
            'conflicts': 'umass.edu'
          }
        })
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('id');
          res.body.id.should.be.a('string');
          res.body.id.should.not.equals('');
          noteId = res.body.id;
          res.body.content.should.not.have.property('pdf');
          chai.request(server)
          .get('/pdf?id=' + noteId)
          .set('User-Agent', 'test-create-script')
          .end(function(err, res) {
            res.should.have.status(404);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('status');
            res.body.should.have.property('name');
            res.body.should.have.property('message');
            res.body.message.should.equals('Not Found');
            done();
          });
        });
      });
    });
  });

});
