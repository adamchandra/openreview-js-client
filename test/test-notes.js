var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

chai.should();
chai.use(chaiHttp);

describe('Notes', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  var replyContent = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     }
  };

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

  it('should create a note and list the created one', function(done) {
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
              'title': 'SHOULD SUCCEED Title|1?.',
              'abstract': 'The abstract of test paper 1',
              'authors': ['Test User.'],
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
              res.body.notes[0].number.should.equal(1);
              res.body.notes[0].should.have.property('tauthor');
              res.body.notes[0].tauthor.should.equal(superUser);
              res.body.notes[0].signatures.should.eql(['~Super_User1']);
              res.body.notes[0].writers.should.eql(['~Test_User1']);
              res.body.notes[0].readers.should.eql(['everyone']);
              res.body.notes[0].nonreaders.should.eql([]);
              res.body.notes[0].content.should.have.property('paperhash');
              res.body.notes[0].content.paperhash.should.equal('user|should_succeed_title1');
              chai.request(server)
              .get('/notes?id=' + noteId)
              .set('Authorization', 'Bearer ' + testToken)
              .set('User-Agent', 'test-create-script')
              .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('notes');
                res.body.notes.should.be.a('array');
                res.body.notes.length.should.equal(1);
                res.body.notes[0].number.should.equal(1);
                res.body.notes[0].should.not.have.property('tauthor');
                chai.request(server)
                  .post('/notes')
                  .set('Authorization', 'Bearer ' + superToken)
                  .set('User-Agent', 'test-create-script')
                  .send({
                    'id': noteId,
                    'invitation': 'ICC.cc/-/submission',
                    'forum': null,
                    'parent': null,
                    'signatures': ['~Super_User1'],
                    'writers': ['~Test_User1'],
                    'readers': ['everyone'],
                    'pdfTransfer': 'url',
                    'content': {
                      'title': 'EDITED SHOULD SUCCEED 1',
                      'abstract': 'The abstract of test paper 1',
                      'authors': ['Test User'],
                      'author_emails': 'test@host.com',
                      'conflicts': 'umass.edu',
                      'CMT_id': '',
                      'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
                    }
                  }).end(function(err, res){
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.have.property('id');
                    res.body.id.should.be.a('string');
                    res.body.id.should.not.equals('');
                    res.body.content.should.have.property('paperhash');
                    res.body.content.paperhash.should.equals('user|edited_should_succeed_1');
                    done();
                  });
              });
            });
          });
      });
    });
  });

  it('should create a note as non reader but as writer and list the created one', function(done) {
    utils.createGroup('ICC2.cc', superUser, superToken, ['everyone'], function(){
      utils.createInvitation('ICC2.cc/-/submission', 'ICC2.cc', superToken, {}, { 'values-regex': '.+' }, function(){
        chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + testToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC2.cc/-/submission',
            'forum': null,
            'parent': null,
            'signatures': ['~Test_User1'],
            'writers': ['~Test_User1'],
            'readers': ['ICC2.cc'], //be carefull when we set the readers, should be part of the invitation signature
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': 'Test User',
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
            var noteId = res.body.id;
            chai.request(server)
            .get('/notes?id=' + noteId)
            .set('Authorization', 'Bearer ' + testToken)
            .set('User-Agent', 'test-create-script')
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('notes');
              res.body.notes.should.be.a('array');
              res.body.notes.length.should.equal(1);
              res.body.notes[0].number.should.equal(1);
              res.body.notes[0].should.have.property('tauthor');
              chai.request(server)
              .get('/notes?invitation=ICC2.cc/-/submission')
              .set('Authorization', 'Bearer ' + testToken)
              .set('User-Agent', 'test-create-script')
              .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('notes');
                res.body.notes.should.be.a('array');
                res.body.notes.length.should.equal(1);
                res.body.notes[0].number.should.equal(1);
                res.body.notes[0].should.have.property('tauthor');
                done();
              });
            });
          });
      });
    });
  });

  it('should create a note with keywords as an array', function(done) {
    utils.createGroup('ICC3.cc', superUser, superToken, ['everyone'], function(){
      utils.createInvitation('ICC3.cc/-/submission', 'ICC3.cc', superToken, {}, { values: ['everyone'] }, function(){
        chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC3.cc/-/submission',
            'forum': null,
            'parent': null,
            'signatures': ['~Super_User1'],
            'writers': ['~Test_User1'],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': 'Test User',
              'author_emails': 'test@host.com',
              'conflicts': 'umass.edu',
              'CMT_id': '',
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf',
              'keywords':['keyword1','keyword2']
            }
          })
          .end(function(err, res) {
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
              res.body.notes[0].number.should.equal(1);
              res.body.notes[0].should.have.a.property('content');
              res.body.notes[0].content.should.have.a.property('keywords');
              res.body.notes[0].content.keywords.should.be.a('array');
              res.body.notes[0].content.keywords[0].should.equal('keyword1');
              res.body.notes[0].content.keywords[1].should.equal('keyword2');
              done();
            })
          });
      });
    });
  });

  it('should create a note to submit a paper', function(done) {

    var content = {
      'title': {
        'order': 3,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.'
      },
      'abstract': {
        'order': 4,
        'value-regex': '[\\S\\s]{1,5000}',
        'description': 'Abstract of paper.'
      },
      'authors': {
        'order': 1,
        'values-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author names, as they appear in the paper.'
      },
      'authorids': {
        'order': 2,
        'values-regex': '([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
        'description': 'Comma separated list of author email addresses, in the same order as above.'
      },
      'conflicts': {
        'order': 100,
    //    'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'value-regex': "^([a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))+(;[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))*$",
        'description': 'Semi-colon separated list of email domains of people who would have a conflict of interest in reviewing this paper, (e.g., cs.umass.edu;google.com, etc.).'
      },
      'CMT_id': {
      'order': 5,
      'value-regex': '.*',                            // if this is a resubmit, specify the CMT ID
      'description': 'If the paper is a resubmission from the ICLR 2016 Conference Track, enter its CMT ID; otherwise, leave blank.'
      },
      'pdf': {
        'order': 4,
        'value-regex': 'upload|http://arxiv.org/pdf/.+',   // either an actual pdf or an arxiv link
        'description': 'Either upload a PDF file or provide a direct link to your PDF on ArXiv.'
      }
    }

    utils.createGroupP('Test.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test.cc/-/submission', 'Test.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED 1',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User', 'Test User 2'],
          'authorids': ['test@host.com', 'test2@host.com'],
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
      return chai.request(server)
        .get('/notes?id=' + res.body.id)
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
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED 1',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User', 'Test User 2'],
          'authorids': ['testhost.com', 'test2@host.com'],
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
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('content.authorids');
      res.body.errors[0].path2.should.equal('invitation.reply.content.authorids');
      res.body.errors[0].value.should.eql(['testhost.com', 'test2@host.com']);
      done();
    })
    .catch(done);
  });

  it('should create a note with a no invitation ang get an error', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED 1',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User'],
          'authorids': ['test@host.com'],
          'conflicts': 'umass.edu',
          'CMT_id': '',
          'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
        }
      })
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].type.should.equal('missing');
        response.body.errors[0].path.should.equal('invitation');
        done();
      })
  });

  it('should create a note with a nonexistent invitation ang get an error', function(done) {

    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test2.cc/-/nonexistent',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED 1',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User'],
          'authorids': ['test@host.com'],
          'conflicts': 'umass.edu',
          'CMT_id': '',
          'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
        }
      })
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].type.should.equal('Not Found');
        response.body.errors[0].path.should.equal('invitation');
        done();
      })
  });

  it('should create an empty content note to submit a paper and get badrequest', function(done) {

    var content = {
      'title': {
        'order': 3,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.',
        required: true
      },
      'abstract': {
        'order': 4,
        'value-regex': '[\\S\\s]{1,5000}',
        'description': 'Abstract of paper.',
        required: true
      },
      'authors': {
        'order': 1,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author names, as they appear in the paper.',
        required: true
      },
      'author_emails': {
        'order': 2,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author email addresses, in the same order as above.',
        required: true
      },
      'conflicts': {
        'order': 100,
    //    'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'value-regex': "^([a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))+(;[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))*$",
        'description': 'Semi-colon separated list of email domains of people who would have a conflict of interest in reviewing this paper, (e.g., cs.umass.edu;google.com, etc.).',
        required: true
      },
      'CMT_id': {
      'order': 5,
      'value-regex': '.*',                            // if this is a resubmit, specify the CMT ID
      'description': 'If the paper is a resubmission from the ICLR 2016 Conference Track, enter its CMT ID; otherwise, leave blank.',
        required: true
      },
      'pdf': {
        'order': 4,
        'value-regex': 'upload|http://arxiv.org/pdf/.+',   // either an actual pdf or an arxiv link
        'description': 'Either upload a PDF file or provide a direct link to your PDF on ArXiv.',
        required: true,
      }
    }

    utils.createGroupP('Test2.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test2.cc/-/submission', 'Test2.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test2.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {}
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(7);
        res.body.errors[0].type.should.equal('missing');
        done();
      });
    })
    .catch(done);
  });

  it('should create an empty note to submit a paper and get badrequest', function(done) {

    var content = {
      'title': {
        'order': 3,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.'
      },
      'abstract': {
        'order': 4,
        'value-regex': '[\\S\\s]{1,5000}',
        'description': 'Abstract of paper.'
      },
      'authors': {
        'order': 1,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author names, as they appear in the paper.'
      },
      'author_emails': {
        'order': 2,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author email addresses, in the same order as above.'
      },
      'conflicts': {
        'order': 100,
    //    'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'value-regex': "^([a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))+(;[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))*$",
        'description': 'Semi-colon separated list of email domains of people who would have a conflict of interest in reviewing this paper, (e.g., cs.umass.edu;google.com, etc.).'
      },
      'CMT_id': {
      'order': 5,
      'value-regex': '.*',                            // if this is a resubmit, specify the CMT ID
      'description': 'If the paper is a resubmission from the ICLR 2016 Conference Track, enter its CMT ID; otherwise, leave blank.'
      },
      'pdf': {
        'order': 4,
        'value-regex': 'upload|http://arxiv.org/pdf/.+',   // either an actual pdf or an arxiv link
        'description': 'Either upload a PDF file or provide a direct link to your PDF on ArXiv.'
      }
    }

    utils.createGroupP('Test2.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test2.cc/-/submission', 'Test2.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test2.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: '',
          abstract: '',
          authors: '',
          author_emails: '',
          conflicts: '',
          CMT_id: '',
          pdf: ''
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(6);
        done();
      });
    })
    .catch(done);
  });

  it('should create an empty note with a required false value', function(done) {

    var content = {
      'title': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.',
        required: false
      }
    };

    utils.createGroupP('Test21.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test21.cc/-/submission', 'Test21.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test21.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': res.body.id,
        'invitation': 'Test21.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'this is a title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.content.title.should.equal('this is a title');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': res.body.id,
        'invitation': 'Test21.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.content.should.not.have.property('title');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create an empty note with a required false and a invalid value, and get an error', function(done) {

    var content = {
      'title': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.',
        required: false
      }
    }

    utils.createGroupP('Test22.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test22.cc/-/submission', 'Test22.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test22.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: ''
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('content.title');
        res.body.errors[0].value.should.equal('');
        done();
      });
    })
    .catch(done);
  });

  it('should create a note with drop-down valid value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-regex":"5: The reviewer is absolutely certain that the evaluation is correct and very familiar with the relevant literature|4: The reviewer is confident but not absolutely certain that the evaluation is correct|3: The reviewer is fairly confident that the evaluation is correct|2: The reviewer is willing to defend the evaluation, but it is quite likely that the reviewer did not understand central parts of the paper|1: The reviewer's evaluation is an educated guess"
     }
    }

    utils.createGroupP('Test3.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test3.cc/-/submission', 'Test3.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test3.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: '3: The reviewer is fairly confident that the evaluation is correct'
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('content');
          res.body.notes[0].content.should.have.property('rating');
          res.body.notes[0].content.rating.should.equal(3);
          done();
        })
    })
    .catch(done);
  });

  it('should create a note with drop-down valid string value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": ['Excellent', 'Very good', 'Good', 'Not enough']
     },
     "confidence":{
        "order":4,
        "value-regex":"5: The reviewer is absolutely certain that the evaluation is correct and very familiar with the relevant literature|4: The reviewer is confident but not absolutely certain that the evaluation is correct|3: The reviewer is fairly confident that the evaluation is correct|2: The reviewer is willing to defend the evaluation, but it is quite likely that the reviewer did not understand central parts of the paper|1: The reviewer's evaluation is an educated guess"
     }
    }

    utils.createGroupP('Test7.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test7.cc/-/submission', 'Test7.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test7.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 'Good',
          confidence: '3: The reviewer is fairly confident that the evaluation is correct'
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('content');
          res.body.notes[0].content.should.have.property('rating');
          res.body.notes[0].content.rating.should.equal('Good');
          done();
        })
    })
    .catch(function(err){
      console.log("Error:", err);
      done(err);
    })
  });

  it('should create a note with number options drop-down and a valid string value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1, 2, 3, 4]
     },
     "confidence":{
        "order":4,
        "value-regex":"5: The reviewer is absolutely certain that the evaluation is correct and very familiar with the relevant literature|4: The reviewer is confident but not absolutely certain that the evaluation is correct|3: The reviewer is fairly confident that the evaluation is correct|2: The reviewer is willing to defend the evaluation, but it is quite likely that the reviewer did not understand central parts of the paper|1: The reviewer's evaluation is an educated guess"
     }
    }

    utils.createGroupP('Test8.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test8.cc/-/submission', 'Test8.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test8.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: '3',
          confidence: '3: The reviewer is fairly confident that the evaluation is correct'
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('content');
          res.body.notes[0].content.should.have.property('rating');
          res.body.notes[0].content.rating.should.equal('3');
          done();
        })
    })
    .catch(function(err) {
      done(err);
    })
  });

  it('should create a note with drop-down invalid value and get a badrequest', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-regex":"5: The reviewer is absolutely certain that the evaluation is correct and very familiar with the relevant literature|4: The reviewer is confident but not absolutely certain that the evaluation is correct|3: The reviewer is fairly confident that the evaluation is correct|2: The reviewer is willing to defend the evaluation, but it is quite likely that the reviewer did not understand central parts of the paper|1: The reviewer's evaluation is an educated guess"
     }
    }

    utils.createGroupP('Test4.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test4.cc/-/submission', 'Test4.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test4.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 5,
          confidence: '3: The reviewer is fairly confident that the evaluation is correct'
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('content.rating');
        res.body.errors[0].value.should.equal(5);
        res.body.errors[0].path2.should.equal("invitation.reply.content.rating");
        res.body.errors[0].value2.should.be.a('object');
        done();
      });
    })
    .catch(done);
  });

  it('should create a note with value-radio valid value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     }
    }

    utils.createGroupP('Test5.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test5.cc/-/submission', 'Test5.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test5.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 1
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('content');
          res.body.notes[0].content.should.have.property('confidence');
          res.body.notes[0].content.confidence.should.equal(1);
          done();
        })
    })
  });

  it('should create a note with value-radio invalid value and get a badrequest', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     }
    }

    utils.createGroupP('Test6.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test6.cc/-/submission', 'Test6.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test6.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 4
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('content.confidence');
        res.body.errors[0].value.should.equal(4);
        res.body.errors[0].path2.should.equal("invitation.reply.content.confidence");
        res.body.errors[0].value2.should.be.a('object');
        done();
      });
    })
  });

  it('should create a note with value-checkbox valid value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-checkbox": 'I accept'
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     }
    }

    utils.createGroupP('Test5.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test5.cc/-/submission', 'Test5.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test5.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 'I accept',
          confidence: 1
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
        .get('/notes?id=' + res.body.id)
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
      res.body.notes[0].should.have.property('content');
      res.body.notes[0].content.should.have.property('rating');
      res.body.notes[0].content.rating.should.equal('I accept');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test5.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 'I accept other things',
          confidence: 1
        }
      });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('content.rating');
      res.body.errors[0].value.should.equal('I accept other things');
      res.body.errors[0].path2.should.equal("invitation.reply.content.rating");
      res.body.errors[0].value2.should.be.a('object');
      done();
    })
    .catch(function(error){
      done(error);
    })
  });

  it('should create a note with values-checkbox valid value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "values-checkbox": ['A', 'B', 'C'],
        required: true
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     }
    }

    utils.createGroupP('Test5.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test5.cc/-/submission', 'Test5.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test5.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: ['C', 'B'],
          confidence: 1
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
        .get('/notes?id=' + res.body.id)
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
      res.body.notes[0].should.have.property('content');
      res.body.notes[0].content.should.have.property('rating');
      res.body.notes[0].content.rating.should.eql(['C', 'B']);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test5.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: ['D'],
          confidence: 1
        }
      });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('content.rating');
      res.body.errors[0].value.should.eql(['D']);
      res.body.errors[0].path2.should.equal("invitation.reply.content.rating");
      res.body.errors[0].value2.should.be.a('object');
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test5.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: [],
          confidence: 1
        }
      });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equals('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('missing');
      res.body.errors[0].path.should.equal('content.rating');
      done();
    })
    .catch(function(error){
      done(error);
    })
  });


  it('should create a note with a single literal value', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     },
     "type":{
        "order":5,
        "value": "Unofficial Review"
     }
    }

    utils.createGroupP('Test9.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test9.cc/-/submission', 'Test9.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'Test9.cc/-/submission',
          'forum': null,
          'parent': null,
          'signatures': ['~Super_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'pdfTransfer': 'url',
          'content': {
            title: 'this is a title',
            review: 'this is a review',
            rating: 3,
            confidence: 3,
            type: "Unofficial Review"
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('content');
          res.body.notes[0].content.should.have.property('type');
          res.body.notes[0].content.type.should.equal('Unofficial Review');
          done();
        })
    })
  });

  it('should create a note with a single literal invalid value and get a badrequest', function(done) {

    var content = {
     "title":{
        "order":1,
        "value-regex":".{0,500}",
        "description":"Brief summary of your review."
     },
     "review":{
        "order":2,
        "value-regex":"[\\S\\s]{1,5000}",
        "description":"Please provide an evaluation of the quality, clarity, originality and significance of this work, including a list of its pros and cons."
     },
     "rating":{
        "order":3,
        "value-dropdown": [1,2,3,4]
     },
     "confidence":{
        "order":4,
        "value-radio": [1,2,3]
     },
     "type":{
        "order":5,
        "value": "Unofficial Review"
     }
    }

    utils.createGroupP('Test10.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test10.cc/-/submission', 'Test10.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test10.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3,
          type: 0
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('content.type');
        res.body.errors[0].value.should.equal(0);
        res.body.errors[0].path2.should.equal("invitation.reply.content.type");
        res.body.errors[0].value2.should.be.a('object');
        done();
      });
    })
  });

  it('should create a note with everyone value as readers', function(done) {

    utils.createGroupP('Test11.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test11.cc/-/submission', 'Test11.cc', superToken, replyContent, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test11.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('readers');
          res.body.notes[0].readers.should.be.a('array');
          res.body.notes[0].readers.length.should.equal(1);
          res.body.notes[0].readers[0].should.equal('everyone');
          done();
        })
    })
  });

  it('should create a note with values as readers and return a badrequest', function(done) {

    utils.createGroupP('Test12.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test12.cc/-/submission', 'Test12.cc', superToken, replyContent, { values: ['everyone'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test12.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('readers');
        res.body.errors[0].value[0].should.equal("~Test_User1");
        res.body.errors[0].path2.should.equal("invitation.reply.readers");
        res.body.errors[0].value2.should.be.a('object');
        done();
      });
    });
  });

  it('should create a note with values-regex as readers', function(done) {

    utils.createGroupP('Test13.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test13.cc/-/submission', 'Test13.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test13.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
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

      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('readers');
          res.body.notes[0].readers.should.be.a('array');
          res.body.notes[0].readers.length.should.equal(1);
          res.body.notes[0].readers[0].should.equal('~Test_User1');
          done();
        })
    })
  });

  it('should create a note with values-regex as readers and return a badrequest', function(done) {

    utils.createGroupP('Test14.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test14.cc/-/submission', 'Test14.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test14.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('readers');
        res.body.errors[0].value[0].should.equal("everyone");
        res.body.errors[0].path2.should.equal("invitation.reply.readers");
        res.body.errors[0].value2.should.be.a('object');
        done();
      });
    });
  });

  it('should create a note with values-regex as writers and signatures', function(done) {

    utils.createGroupP('Test15.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test15.cc/-/submission', 'Test15.cc', superToken, replyContent, { 'values-regex': '~.*' });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test15.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('readers');
          res.body.notes[0].readers.should.be.a('array');
          res.body.notes[0].readers.length.should.equal(1);
          res.body.notes[0].readers[0].should.equal('~Test_User1');
          done();
        })
    })
  });

  it('should create a note with values-regex as nonreaders', function(done) {

    utils.createGroupP('Test16.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test16.cc/-/submission', 'Test16.cc', superToken, replyContent, { 'values-regex': '~.*' });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test16.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'nonreaders': ['~Test_User2'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
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
      chai.request(server)
        .get('/notes?id=' + res.body.id)
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('notes');
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].should.have.property('nonreaders');
          res.body.notes[0].nonreaders.should.be.a('array');
          res.body.notes[0].nonreaders.length.should.equal(1);
          res.body.notes[0].nonreaders[0].should.equal('~Test_User2');
          done();
        })
    })
  });

  it('should edit a nonexistent note and get a badrequest', function(done) {
    chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'invalidid'
      })
      .end(function(error, response) {
          response.should.have.status(400);
          done();
      });
  });

  it('should create a note to submit a paper with pdf url different to arxiv', function(done) {

    var content = {
      'title': {
        'order': 3,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.'
      },
      'abstract': {
        'order': 4,
        'value-regex': '[\\S\\s]{1,5000}',
        'description': 'Abstract of paper.'
      },
      'authors': {
        'order': 1,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author names, as they appear in the paper.'
      },
      'author_emails': {
        'order': 2,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author email addresses, in the same order as above.'
      },
      'conflicts': {
        'order': 100,
    //    'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'value-regex': "^([a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))+(;[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))*$",
        'description': 'Semi-colon separated list of email domains of people who would have a conflict of interest in reviewing this paper, (e.g., cs.umass.edu;google.com, etc.).'
      },
      'CMT_id': {
      'order': 5,
      'value-regex': '.*',                            // if this is a resubmit, specify the CMT ID
      'description': 'If the paper is a resubmission from the ICLR 2016 Conference Track, enter its CMT ID; otherwise, leave blank.'
      },
      'pdf': {
        'order': 4,
        'value-regex': 'upload|http://.*\\.pdf',   // either an actual pdf or an arxiv link
        'description': 'Either upload a PDF file or provide a direct link to your PDF on ArXiv.'
      }
    }

    utils.createGroupP('Test17.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test17.cc/-/submission', 'Test17.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test17.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED 1',
          'abstract': 'The abstract of test paper 1',
          'authors': 'Test User',
          'author_emails': 'test@host.com',
          'conflicts': 'umass.edu',
          'CMT_id': '',
          'pdf': 'http://someserver/1506.03425v1.pdf'
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
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test17.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'SHOULD SUCCEED 1',
          'abstract': 'The abstract of test paper 1',
          'authors': 'Test User',
          'author_emails': 'test@host.com',
          'conflicts': 'umass.edu',
          'CMT_id': '',
          'pdf': 'http://someserver/1506.03425v1.xls'
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notMatch');
        res.body.errors[0].path.should.equal('content.pdf');
        res.body.errors[0].value.should.equal("http://someserver/1506.03425v1.xls");
        res.body.errors[0].path2.should.equal("invitation.reply.content.pdf['value-regex']");
        res.body.errors[0].value2.should.equal('upload|http://.*\\\.pdf');
        done();
      })
    })
    .catch(done);
  });

  it('should create a note without readers and return a badrequest', function(done) {

    utils.createGroupP('Test18.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test18.cc/-/submission', 'Test18.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test18.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('readers');
        done();
      });
    });
  });


  it('should create a note with empty readers and return a badrequest', function(done) {

    utils.createGroupP('Test19.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test19.cc/-/submission', 'Test19.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test19.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'readers': [],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('readers');
        done();
      });
    });
  });


  it('should create a note with not signatory signatures and return a badrequest', function(done) {

    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('notSignatory');
        res.body.errors[0].path.should.equal('signatures');
        done();
      });
    });
  });

  it('should create a note without writer and signatures and get a badrequest', function(done) {
    utils.createGroup('ICC4.cc', superUser, superToken, ['everyone'], function(){
      utils.createInvitation('ICC4.cc/-/submission', 'ICC4.cc', superToken, {}, { values: ['everyone'] }, function(){
        chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC4.cc/-/submission',
            'forum': null,
            'parent': null,
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': 'Test User',
              'author_emails': 'test@host.com',
              'conflicts': 'umass.edu',
              'CMT_id': '',
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          })
          .end(function(err, res) {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.name.should.equals('error');
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            res.body.errors.length.should.equal(1);
            res.body.errors[0].type.should.equal('missing');
            res.body.errors[0].path.should.equal('signatures');
            done();
          });
      });
    });
  });

  it('should create a note with empty writer and signatures and get a badrequest', function(done) {
    utils.createGroup('ICC5.cc', superUser, superToken, ['everyone'], function(){
      utils.createInvitation('ICC5.cc/-/submission', 'ICC5.cc', superToken, {}, { values: ['everyone'] }, function(){
        chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC5.cc/-/submission',
            'forum': null,
            'parent': null,
            'signatures': [],
            'writers': [],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': 'Test User',
              'author_emails': 'test@host.com',
              'conflicts': 'umass.edu',
              'CMT_id': '',
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          })
          .end(function(err, res) {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.name.should.equals('error');
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            res.body.errors.length.should.equal(1);
            res.body.errors[0].type.should.equal('missing');
            res.body.errors[0].path.should.equal('signatures');
            done();
          });
      });
    });
  });

  it('should create a note after the invitation duedate and get an ok', function(done) {
    utils.createGroup('ICC30.cc', superUser, superToken, ['everyone'], function(){
      utils.createExpiredInvitationP('ICC30.cc/-/submission', 'ICC30.cc', superToken, {}, { values: ['everyone'] }, true)
      .then(function(response){
        chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC30.cc/-/submission',
            'forum': null,
            'parent': null,
            'signatures': ['~Super_User1'],
            'writers': ['~Test_User1'],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': 'Test User',
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
            done();
          });
      });
    });
  });

  it('should create a note before the invitation duedate and get an ok', function(done) {
    utils.createGroup('ICC30.cc', superUser, superToken, ['everyone'], function(){
      utils.createExpiredInvitationP('ICC30.cc/-/submission', 'ICC30.cc', superToken, {}, { values: ['everyone'] }, false)
      .then(function(response){
        chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': 'ICC30.cc/-/submission',
            'forum': null,
            'parent': null,
            'signatures': ['~Super_User1'],
            'writers': ['~Test_User1'],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': 'Test User',
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
            done();
          });
      });
    });
  });


  it('should create a note with required field missing an get a badrequest', function(done) {

    replyContent['subject_areas'] = {
      'description': 'List of areas of expertise.',
      'order': 4,
      'values-dropdown': ['area1', 'area2'],
      'required': true
    }
    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('content.subject_areas');
        done();
      });
    });
  });

  it('should create a note with required field with an empty collection an get a badrequest', function(done) {

    replyContent['subject_areas'] = {
      'description': 'List of areas of expertise.',
      'order': 4,
      'values-dropdown': ['area1', 'area2'],
      'required': true
    }
    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3,
          subject_areas: []
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('content.subject_areas');
        done();
      });
    });
  });

  it('should create a note with required field with an empty string an get a badrequest', function(done) {

    replyContent['conflicts'] = {
      'description': 'List of areas of expertise.',
      'order': 4,
      'value-regex': '.{1,250}',
      'required': true
    }
    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3,
          subject_areas: ['area1'],
          conflicts: ''
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('content.conflicts');
        done();
      });
    });
  });

  it('should create a note with required field and get an ok', function(done) {

    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          title: 'this is a title',
          review: 'this is a review',
          rating: 3,
          confidence: 3,
          subject_areas: ['area1'],
          conflicts: 'google.com'
        }
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        done();
      });
    });
  });

  it('should validate the required fields following the field order', function(done) {

    var replyContent = {
      'title': {
          'description': 'Title of paper.',
          'order': 1,
          'value-regex': '.{1,250}',
          'required': true
      },
      'authors': {
          'description': 'Comma separated list of author names.',
          'order': 2,
          'values-regex': "[^;,\\n]+(,[^,\\n]+)*",
          'required': true
      },
      'authorids': {
          'description': 'Comma separated list of author email addresses, in the same order as above. Be sure each email address is linked to the each author profile.',
          'order': 3,
          'values-regex': "([a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,},){0,}([a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,})",
          'required': true
      },
      'subject_areas': {
          'description': 'List of areas of expertise.',
          'order': 4,
          'values-dropdown': ['a', 'b', 'c'],
          'required': true
      },
      'keywords': {
          'description': 'Comma separated list of keywords.',
          'order': 6,
          'values-regex': "(^$)|[^;,\\n]+(,[^,\\n]+)*"
      },
      'TL;DR': {
          'description': '\"Too Long; Didn\'t Read\": a short sentence describing your paper',
          'order': 7,
          'value-regex': '[^\\n]{0,250}',
      },
      'abstract': {
          'description': 'Abstract of paper.',
          'order': 8,
          'value-regex': '[\\S\\s]{1,5000}',
          'required': true
      },
      'pdf': {
          'description': 'Upload a PDF file that ends with .pdf)',
          'order': 9,
          'value-regex': 'upload',
          'required': true
      },
      'student paper': {
          'description': 'Is this a student paper?',
          'order': 10,
          'value-radio': [
              'Yes',
              'No'
          ],
          'required': true
      }
    }

    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {}
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(7);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('content.title');
        res.body.errors[1].type.should.equal('missing');
        res.body.errors[1].path.should.equal('content.authors');
        res.body.errors[2].type.should.equal('missing');
        res.body.errors[2].path.should.equal('content.authorids');
        res.body.errors[3].type.should.equal('missing');
        res.body.errors[3].path.should.equal('content.subject_areas');
        res.body.errors[4].type.should.equal('missing');
        res.body.errors[4].path.should.equal('content.abstract');
        res.body.errors[5].type.should.equal('missing');
        res.body.errors[5].path.should.equal('content.pdf');
        res.body.errors[6].type.should.equal('missing');
        res.body.errors[6].path.should.equal('content.student paper');
        done();
      });
    });
  });

  it('should validate the fields following the field order', function(done) {

    var replyContent = {
      'title': {
          'description': 'Title of paper.',
          'order': 1,
          'value-regex': '.{1,250}',
          'required': true
      },
      'authors': {
          'description': 'Comma separated list of author names.',
          'order': 2,
          'values-regex': "[^;,\\n]+(,[^,\\n]+)*",
          'required': true
      },
      'authorids': {
          'description': 'Comma separated list of author email addresses, in the same order as above. Be sure each email address is linked to the each author profile.',
          'order': 3,
          'values-regex': ".*",
          'required': true
      },
      'subject_areas': {
          'description': 'List of areas of expertise.',
          'order': 4,
          'values-dropdown': ['a', 'b', 'c'],
          'required': true
      },
      'keywords': {
          'description': 'Comma separated list of keywords.',
          'order': 6,
          'values-regex': "(^$)|[^;,\\n]+(,[^,\\n]+)*"
      },
      'TL;DR': {
          'description': '\"Too Long; Didn\'t Read\": a short sentence describing your paper',
          'order': 7,
          'value-regex': '[^\\n]{0,250}',
      },
      'abstract': {
          'description': 'Abstract of paper.',
          'order': 8,
          'value-regex': '[\\S\\s]{1,5000}',
          'required': true
      },
      'pdf': {
          'description': 'Upload a PDF file that ends with .pdf)',
          'order': 9,
          'value-regex': 'upload',
          'required': true
      },
      'student paper': {
          'description': 'Is this a student paper?',
          'order': 10,
          'value-radio': [
              'Yes',
              'No'
          ],
          'required': true
      }
    }

    utils.createGroupP('Test20.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test20.cc/-/submission', 'Test20.cc', superToken, replyContent, { 'values-regex': ['~.*'] });
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test20.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Test_User1'],
        'readers': ['~Test_User1'],
        'writers': ['~Test_User1'],
        'pdfTransfer': 'url',
        'content': {
          "title": "",
          "authors": ['aaa'],
          "authorids": ['ddd'],
          "subject_areas": ['d'],
          "abstract": '',
          "pdf": '/ddd.pdf',
          "student paper": 'xx'
        }
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equals('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(5);
        res.body.errors[0].type.should.equal('missing');
        res.body.errors[0].path.should.equal('content.title');
        res.body.errors[1].type.should.equal('notMatch');
        res.body.errors[1].path.should.equal('content.subject_areas');
        res.body.errors[2].type.should.equal('missing');
        res.body.errors[2].path.should.equal('content.abstract');
        res.body.errors[3].type.should.equal('notMatch');
        res.body.errors[3].path.should.equal('content.pdf');
        res.body.errors[4].type.should.equal('notMatch');
        res.body.errors[4].path.should.equal('content.student paper');
        done();
      });
    });
  });

  it('should create a note with a title with special characters and get the correct paperhash', function(done) {
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
              'title': 'Feature Learning in Deep Neural Networks - A Study on Speech Recognition\r\n    Tasks',
              'abstract': 'The abstract of test paper 1',
              'authors': ['Johannes Ballé'],
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
            res.body.number.should.equal(2);
            res.body.should.have.property('tauthor');
            res.body.tauthor.should.equal(superUser);
            res.body.signatures.should.eql(['~Super_User1']);
            res.body.writers.should.eql(['~Test_User1']);
            res.body.readers.should.eql(['everyone']);
            res.body.nonreaders.should.eql([]);
            res.body.content.should.have.property('paperhash');
            res.body.content.paperhash.should.equal('ballé|feature_learning_in_deep_neural_networks_a_study_on_speech_recognition_tasks');
            done();
          });
      });
    });
  });

  it('should create a note with an optional pdf value and get an ok', function(done) {
    var content = {
      'title': {
        'order': 3,
        'value-regex': '.{1,100}',
        'description': 'Title of paper.'
      },
      'abstract': {
        'order': 4,
        'value-regex': '[\\S\\s]{1,5000}',
        'description': 'Abstract of paper.'
      },
      'authors': {
        'order': 1,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author names, as they appear in the paper.'
      },
      'authorids': {
        'order': 2,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'Comma separated list of author email addresses, in the same order as above.'
      },
      'conflicts': {
        'order': 100,
    //    'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'value-regex': "^([a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))+(;[a-zA-Z0-9][a-zA-Z0-9-_]{0,61}[a-zA-Z0-9]{0,1}\\.([a-zA-Z]{1,6}|[a-zA-Z0-9-]{1,30}\\.[a-zA-Z]{2,3}))*$",
        'description': 'Semi-colon separated list of email domains of people who would have a conflict of interest in reviewing this paper, (e.g., cs.umass.edu;google.com, etc.).'
      },
      'CMT_id': {
      'order': 5,
      'value-regex': '.*',                            // if this is a resubmit, specify the CMT ID
      'description': 'If the paper is a resubmission from the ICLR 2016 Conference Track, enter its CMT ID; otherwise, leave blank.'
      },
      'pdf': {
        'order': 4,
        'value-regex': 'http(s)?://.+',
        'description': 'Provide a url',
        'required': false
      }
    }

    utils.createGroupP('Test21.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return utils.createInvitationP('Test21.cc/-/submission', 'Test21.cc', superToken, content);
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test21.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'Paper without pdf value',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User'],
          'authorids': ['test@host.com'],
          'conflicts': 'umass.edu',
          'CMT_id': ''
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
      res.body.content.should.not.have.property('pdf');
      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'invitation': 'Test21.cc/-/submission',
        'forum': null,
        'parent': null,
        'signatures': ['~Super_User1'],
        'writers': ['~Test_User1'],
        'readers': ['everyone'],
        'pdfTransfer': 'url',
        'content': {
          'title': 'Paper with pdf value',
          'abstract': 'The abstract of test paper 1',
          'authors': ['Test User'],
          'authorids': ['test@host.com'],
          'conflicts': 'umass.edu',
          'CMT_id': '',
          'pdf': 'http://someserver/1506.03425v1.xls'
        }
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.be.a('string');
        res.body.content.pdf.should.equal("http://someserver/1506.03425v1.xls");
        done();
      })
    })
    .catch(done);
  });

  it('should create a note with two different writers and get an ok', function(done) {
    var noteId;
    utils.createInvitationP('ICC.cc/-/submission_writers', 'ICC.cc', superToken, {}, { values: ['everyone'] }, { 'values-regex': '~.*|\\(anonymous\\)' })
    .then(function(res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.reply.writers.should.eql({ 'values-regex': '~.*|\\(anonymous\\)' });
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission_writers',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1', '(anonymous)'],
          'readers': ['everyone'],
          'pdfTransfer': 'url',
          'content': {
            'title': 'SHOULD SUCCEED Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
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
      res.body.writers.should.eql(['~Test_User1', '(anonymous)']);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission_writers',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['(anonymous)', '~Test_User1'],
          'readers': ['everyone'],
          'pdfTransfer': 'url',
          'content': {
            'title': 'Two different writers Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
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
      res.body.writers.should.eql(['(anonymous)', '~Test_User1']);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission_writers',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['(anonymous)'],
          'readers': ['everyone'],
          'pdfTransfer': 'url',
          'content': {
            'title': 'Anonymous writers Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
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
      res.body.writers.should.eql(['(anonymous)']);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission_writers',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'pdfTransfer': 'url',
          'content': {
            'title': 'Test user writer Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
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
      res.body.writers.should.eql(['~Test_User1']);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ICC.cc/-/submission_writers',
          'forum': null,
          'parent': null,
          'signatures': ['~Test_User1'],
          'writers': ['(anonymous)', 'anotheruser'],
          'readers': ['everyone'],
          'pdfTransfer': 'url',
          'content': {
            'title': 'Another user writer Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
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
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('writers');
      res.body.errors[0].path2.should.equal('invitation.reply.writers');
      res.body.errors[0].value.should.eql(['(anonymous)', 'anotheruser']);
      res.body.errors[0].value2.should.eql({ 'values-regex': '~.*|\\(anonymous\\)' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a note setting another tauhor as superuser', function(done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(response){
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(response){
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
          'pdfTransfer': 'url',
          'content': {
            'title': 'Another tauthor Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
            'conflicts': 'umass.edu',
            'CMT_id': '',
            'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
          },
          tauthor: 'another@mail.com'
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      response.body.tauthor.should.equals('another@mail.com');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a note setting another tauhor as another user and tauthor is ignored', function(done) {
    var noteId;
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(response){
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(response){
      return chai.request(server)
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
          'pdfTransfer': 'url',
          'content': {
            'title': 'SHOULD SUCCEED Title|1?.',
            'abstract': 'The abstract of test paper 1',
            'authors': ['Test User.'],
            'author_emails': 'test@host.com',
            'conflicts': 'umass.edu',
            'CMT_id': '',
            'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
          },
          tauthor: 'another@mail.com'
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('id');
      response.body.id.should.be.a('string');
      response.body.id.should.not.equals('');
      response.body.tauthor.should.equals('test@test.com');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

});
