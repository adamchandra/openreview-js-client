'use strict';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');
var exec = require('child_process').execSync;
var _ = require('lodash');

chai.use(chaiHttp);


describe('Search', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  let confid = 'ICC.cc';
  var submissionInvitation = confid + '/-/submission';
  var noteid;

  before(function (done) {
    utils.setUp(function (aSuperToken, aTestToken) {
      superToken = aSuperToken;
      testToken = aTestToken;
      utils.createGroup(confid, superUser, superToken, ['everyone'], function () {
        utils.createInvitation(submissionInvitation, confid, superToken, {}, {values: ['everyone']}, function () {
          chai.request(server)
          .post('/notes')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .send({
            'invitation': submissionInvitation,
            'forum': null,
            'parent': null,
            'signatures': ['~Super_User1'],
            'writers': ['~Test_User1'],
            'readers': ['everyone'],
            'pdfTransfer': 'url',
            'content': {
              'title': 'SHOULD SUCCEED 1',
              'abstract': 'The abstract of test paper 1',
              'authors': ['Red Fish'],
              'authorids': ['test@host.com'],
              'keywords': ['NLP', 'ML'],
              'conflicts': ['umass.edu'],
              'CMT_id': '',
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          })
          .end(function (err, res) {
            noteid = res.body.id;
            chai.request(server)
            .post('/notes')
            .set('Authorization', 'Bearer ' + superToken)
            .set('User-Agent', 'test-create-script')
            .send({
              'invitation': submissionInvitation,
              'forum': null,
              'parent': null,
              'signatures': ['~Super_User1'],
              'writers': ['~Test_User1'],
              'readers': ['everyone'],
              'pdfTransfer': 'url',
              'content': {
                'title': 'SHOULD SUCCEED 2',
                'abstract': 'The abstract of test paper 2',
                'authors': ['Green Llama'],
                'authorids': ['test@host.com'],
                'keywords': ['ML, DL'],
                'conflicts': ['umass.edu'],
                'CMT_id': '',
                'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
              }
            })
            .end(function (err, res) {
              chai.request(server)
              .post('/notes')
              .set('Authorization', 'Bearer ' + superToken)
              .set('User-Agent', 'test-create-script')
              .send({
                'invitation': submissionInvitation,
                'forum': null,
                'parent': null,
                'signatures': ['~Super_User1'],
                'writers': ['~Test_User1'],
                'readers': ['everyone'],
                'pdfTransfer': 'url',
                'content': {
                  'title': 'SHOULD SUCCEED 3',
                  'abstract': 'The abstract of test paper 3',
                  'authors': ['Red Gorilla', 'Blue Fish'],
                  'authorids': ['test@host.com'],
                  'keywords': ['NLP', 'RL'],
                  'conflicts': 'umass.edu',
                  'CMT_id': '',
                  'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
                }
              })
              .end(function (err, res) {
                chai.request(server)
                .post('/notes')
                .set('Authorization', 'Bearer ' + superToken)
                .set('User-Agent', 'test-create-script')
                .send({
                  'invitation': submissionInvitation,
                  'forum': null,
                  'parent': null,
                  'signatures': ['~Super_User1'],
                  'writers': ['~Test_User1'],
                  'readers': ['everyone'],
                  'pdfTransfer': 'url',
                  'content': {
                    "title": "This is a paper title",
                    "abstract": "Test text. Non-hyphenated? Look at this: 'nonsense' \"testing\"! zebra",
                    'authors': ['Michael Z'],
                    'authorids': ['test@host.com'],
                    'keywords': ['AI'],
                    'conflicts': 'umass.edu',
                    'CMT_id': '',
                    'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
                  }
                })
                .end(function (err, res) {
                  chai.request(server)
                  .post('/notes')
                  .set('Authorization', 'Bearer ' + superToken)
                  .set('User-Agent', 'test-create-script')
                  .send({
                    'invitation': submissionInvitation,
                    'forum': null,
                    'parent': null,
                    'signatures': ['~Super_User1'],
                    'writers': ['~Test_User1'],
                    'readers': ['everyone'],
                    'pdfTransfer': 'url',
                    "content": {
                      "title": "b-GAN: Unified Framework of Generative Adversarial Networks",
                      "abstract": "Generative adversarial networks (GANs) are successful deep generative models. They are based on a two-player minimax game. However, the objective function derived in the original motivation is changed to obtain stronger gradients when learning the generator. We propose a novel algorithm that repeats density ratio estimation and f-divergence minimization. Our algorithm offers a new unified perspective toward understanding GANs and is able to make use of multiple viewpoints obtained from the density ratio estimation research, e.g. what divergence is stable and relative density ratio is useful. ",
                      "pdf": "/pdf/debdd3674598cc40a4812df3eeaf7e814823d3bd.pdf",
                      "TL;DR": "New Unified Framework of Generative Adversarial Networks using Bregman divergence beyond f-GAN",
                      "authors": [
                        "Masatosi Uehara",
                        "Issei Sato",
                        "Masahiro Suzuki",
                        "Kotaro Nakayama",
                        "Yutaka Matsuo"
                      ],
                      "conflicts": [
                        "weblab.t.u-tokyo.ac.jp",
                        "k.u-tokyo.ac.jp",
                        "g.ecc.u-tokyo.ac.jp"
                      ],
                      "keywords": [
                        "Deep learning",
                        "Unsupervised Learning"
                      ],
                      "authorids": [
                        "uehara-masatoshi136@g.ecc.u-tokyo.ac.jp",
                        "sato@k.u-tokyo.ac.jp",
                        "masa@weblab.t.u-tokyo.ac.jp",
                        "nakayama@weblab.t.u-tokyo.ac.jp",
                        "matsuo@weblab.t.u-tokyo.ac.jp"
                      ]
                    }
                  })
                  .end(function (err, res) {
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  after(function (done) {
    utils.tearDown(done);
  });

  it('should search and return an empty result', function (done) {
    chai.request(server)
    .get('/notes/search?term=should_fail&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    });
  });

  it('should search for "SHOULD SUCCEED" over all content and should find three notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=SHOULD+SUCCEED&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].content.title.should.contain('SHOULD SUCCEED');
      res.body.notes[1].content.title.should.contain('SHOULD SUCCEED');
      res.body.notes[2].content.title.should.contain('SHOULD SUCCEED');
      done();
    });
  });

  it('should search (case insensitive) for "SHOULD SUCCEED" over all content and should find three notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=SHouLD+SUCCeeD&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].content.title.should.contain('SHOULD SUCCEED');
      res.body.notes[1].content.title.should.contain('SHOULD SUCCEED');
      res.body.notes[2].content.title.should.contain('SHOULD SUCCEED');
      done();
    });
  });

  it('should search for "Red" over authors and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=red&content=authors')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].content.authors.should.be.a('array');
      res.body.notes[0].content.authors[0].should.contain('Red');
      res.body.notes[1].content.authors.should.be.a('array');
      res.body.notes[1].content.authors[0].should.contain('Red');
      done();
    });
  });
  it('should search for TERMS "minimax gradients" over all content and should find 1 note', function (done) {
    chai.request(server)
    .get('/notes/search?term=minimax gradients&type=terms&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.abstract.should.contain('minimax');
      res.body.notes[0].content.abstract.should.contain('gradients');
      done();
    });
  });
  it('should search for PREFIX "minimax gradient" over all content and should find 0 notes', function (done) {
    chai.request(server)
        .get('/notes/search?term=minimax gradient&type=prefix&content=all')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(0);
          done();
        });
  });
  it('should search for PREFIX "gradie" over all content and should find 1 notes', function (done) {
    chai.request(server)
        .get('/notes/search?term=gradie&type=prefix&content=all')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(1);
          res.body.notes[0].content.abstract.should.contain('gradie');

          done();
        });
  });
  it('should search for "Red" over all content and should find two notes', function (done) {
    chai.request(server)
        .get('/notes/search?term=red&content=all')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .end(function (err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.notes.should.be.a('array');
          res.body.notes.length.should.equal(2);
          res.body.notes[0].content.authors.should.be.a('array');
          res.body.notes[0].content.authors[0].should.contain('Red');
          res.body.notes[1].content.authors.should.be.a('array');
          res.body.notes[1].content.authors[0].should.contain('Red');
          done();
        });
  });

  it('should search for "sato@k.u-tokyo.ac.jp" over authors and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=sato@k.u-tokyo.ac.jp&content=authors')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.authorids.should.be.a('array');
      res.body.notes[0].content.authorids.should.contain('sato@k.u-tokyo.ac.jp');
      done();
    });
  });

  it('should search for "sato@k.u-tokyo.ac.jp" over all content and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=sato@k.u-tokyo.ac.jp&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.authorids.should.be.a('array');
      res.body.notes[0].content.authorids.should.contain('sato@k.u-tokyo.ac.jp');
      done();
    });
  });

  it('should search for "sato@k.u-tokyo.ac.jp" or "test@host.com" over all content and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?query="sato@k.u-tokyo.ac.jp"OR"test@host.com"&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(5);
      res.body.notes[0].content.authorids.should.be.a('array');
      res.body.notes[0].content.authorids.should.contain('sato@k.u-tokyo.ac.jp');
      res.body.notes[1].content.authorids.should.contain('test@host.com');
      res.body.notes[2].content.authorids.should.contain('test@host.com');
      res.body.notes[3].content.authorids.should.contain('test@host.com');
      res.body.notes[4].content.authorids.should.contain('test@host.com');
      done();
    });
  });

  it('should search for "sato@k.u-tokyo.ac.jp" or "test@host.com" over all content and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?query="sato@k.u-tokyo.ac.jp"AND"masa@weblab.t.u-tokyo.ac.jp"&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.authorids.should.be.a('array');
      res.body.notes[0].content.authorids.should.contain('sato@k.u-tokyo.ac.jp');
      res.body.notes[0].content.authorids.should.contain('masa@weblab.t.u-tokyo.ac.jp');
      done();
    });
  });


  it('should search for "NLP" over keywords and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=NLP&content=keywords')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].content.keywords.should.be.a('array');
      res.body.notes[0].content.keywords[0].should.contain('NLP');
      res.body.notes[1].content.keywords.should.be.a('array');
      res.body.notes[1].content.keywords[0].should.contain('NLP');
      done();
    });
  });

  it('should search for "NLP" over all content and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=NLP&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].content.keywords.should.be.a('array');
      res.body.notes[0].content.keywords[0].should.contain('NLP');
      res.body.notes[1].content.keywords.should.be.a('array');
      res.body.notes[1].content.keywords[0].should.contain('NLP');
      done();
    });
  });


  it('should find term with double quotes', function (done) {
    chai.request(server)
    .get('/notes/search?term=%22testing%22&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  it('should find term with single quotes', function (done) {
    chai.request(server)
    .get('/notes/search?term=%27nonsense%27&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  it('should find note with a hypenated search term ', function (done) {
    chai.request(server)
    .get('/notes/search?term=non-hyphenated&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  it('should find note with split hypenated query term ', function (done) {
    chai.request(server)
    .get('/notes/search?term=non+hyphenated&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  it('should search for "AI" (a two letter term) over keywords and should find one note', function (done) {
    chai.request(server)
    .get('/notes/search?term=AI&content=keywords')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  // NOTE: to implement auto-complete as you type a query, the AQL uses "prefix:" for
  // the last search term. Since none of the notes have a word that starts with 'x',
  // this will return zero notes.
  it('should not find any notes and not throw an error, search with one character term', function (done) {
    chai.request(server)
    .get('/notes/search?term=x&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    });
  });

  it('should find one note with a term that starts with "z"', function (done) {
    chai.request(server)
    .get('/notes/search?term=z&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  it('should find one notes even with empty search term (extra "+" on URL)', function (done) {
    chai.request(server)
    .get('/notes/search?term=ze+&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.contain('This is a paper title');
      done();
    });
  });

  // note, from the browser the "endpoint" is '/search' but that eventually
  // gets to '/notes/search' so we use that for testing.
  it('should search for a tag value that does not exist, return zero records', function (done) {
    chai.request(server)
    .get('/notes/search?term=i_do_not_exist&content=tags&group=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(0);
      done();
    });
  });


  let validInvitationFreeTextId = confid + '/-/FreeTextTag';

  it('should create invitation for free form text tags, multiReply is true', function (done) {
    utils.createTagInvitation(validInvitationFreeTextId, confid, superToken, {
      "tag": {
        "required": true,
        "value-regex": ".*",
        "description": "Free form text."
      }
    }, {values: ['everyone']}, true, 0, function () {
      done();
    });
  });

  let forum1_id = undefined;
  it('should create new forum', function (done) {
    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': submissionInvitation,
      'forum': null,
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
      forum1_id = res.body.id;
      done();
    })
  });


  var tag1_text = 'Zarozinski';
  var testUser = "test@test.com";

  it('should create new tag for a forum', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tag1_text,
      'signatures': [testUser],
      'readers': ['everyone'],
      'invitation': validInvitationFreeTextId,
      'forum': forum1_id
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(tag1_text);
      res.body.forum.should.equal(forum1_id);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(testUser);
      res.body.tauthor.should.equal(testUser);
      done();
    });
  });

  // it('should search for a tag value that exists, return one record', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=' + tag1_text + '&content=tags&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(1);
  //     res.body.notes[0].tags.length.should.equal(1);
  //     res.body.notes[0].tags[0].tag.should.equal(tag1_text);
  //     done();
  //   });
  // });


  // it('should search for a tag value that exists - case insensitive, return one record', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=' + tag1_text.toLowerCase() + '&content=tags&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(1);
  //     res.body.notes[0].tags.length.should.equal(1);
  //     res.body.notes[0].tags[0].tag.should.equal(tag1_text);
  //     done();
  //   });
  // });


  // it('should search for the partial tag value that exists, return one record', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=' + tag1_text.substr(0, 2) + '&content=tags&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(1);
  //     res.body.notes[0].tags.length.should.equal(1);
  //     res.body.notes[0].tags[0].tag.should.equal(tag1_text);
  //     done();
  //   });
  // });


  // it('should search for a tag value that exists across ALL content, return one record', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=' + tag1_text + '&content=all&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(1);
  //     res.body.notes[0].tags.length.should.equal(1);
  //     res.body.notes[0].tags[0].tag.should.equal(tag1_text);
  //     done();
  //   });
  // });


  // it('should find one note and one tag with a term that starts with "z"', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=z&content=all&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(2);
  //     res.body.notes[0].content.title.should.equal('test');
  //     res.body.notes[0].tags.length.should.equal(1);
  //     res.body.notes[0].tags[0].tag.should.equal(tag1_text);
  //     res.body.notes[1].content.title.should.contain('This is a paper title');
  //     res.body.notes[1].tags.length.should.equal(0);
  //     done();
  //   });
  // });

  let tag2_text = "zero";
  it('should create new tag for a forum', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tag2_text,
      'signatures': [testUser],
      'readers': ['everyone'],
      'invitation': validInvitationFreeTextId,
      'forum': forum1_id
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(tag2_text);
      res.body.forum.should.equal(forum1_id);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(testUser);
      res.body.tauthor.should.equal(testUser);
      done();
    });
  });


  // it('should search for the partial tag value that exists, return one note with two tags', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=' + tag1_text.substr(0, 1) + '&content=tags&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(1);
  //     res.body.notes[0].tags.length.should.equal(2);
  //     res.body.notes[0].tags[0].tag.should.equal(tag2_text);
  //     res.body.notes[0].tags[1].tag.should.equal(tag1_text);
  //     done();
  //   });
  // });

  let tag3_text = "I cannot review";
  it('should create new tag for a forum', function (done) {
    chai.request(server)
    .post('/tags')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'tag': tag3_text,
      'signatures': [testUser],
      'readers': ['everyone'],
      'invitation': validInvitationFreeTextId,
      'forum': forum1_id
    })
    .end(function (error, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('tag');
      res.body.tag.should.equal(tag3_text);
      res.body.forum.should.equal(forum1_id);
      res.body.should.have.property('signatures');
      res.body.signatures.length.should.equal(1);
      res.body.signatures[0].should.equal(testUser);
      res.body.tauthor.should.equal(testUser);
      done();
    });
  });

  // it('should find one note and all three tags for that note that contains the term "cannot"', function (done) {
  //   chai.request(server)
  //   .get('/notes/search?term=cannot&content=tags&group=all')
  //   .set('Authorization', 'Bearer ' + superToken)
  //   .set('User-Agent', 'test-create-script')
  //   .end(function (err, res) {
  //     res.should.have.status(200);
  //     res.should.be.json;
  //     res.body.notes.should.be.a('array');
  //     res.body.notes.length.should.equal(1);
  //     res.body.notes[0].forum.should.equal(forum1_name);
  //     res.body.notes[0].tags.length.should.equal(3);
  //     res.body.notes[0].tags[0].tag.should.equal(tag3_text);
  //     res.body.notes[0].tags[1].tag.should.equal(tag2_text);
  //     res.body.notes[0].tags[2].tag.should.equal(tag1_text);
  //     done();
  //   });
  // });

  // test search of notes where forum is deleted
  it('should create a note in response to another note', function (done) {

    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': submissionInvitation,
      'replyto': noteid,
      'forum': noteid,
      'signatures': ['~Super_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'pdfTransfer': 'url',
      'content': {
        'comment': 'subnote1'
      }
    })
    .end(function (err, res) {
      done();
    });
  });

  var secondNoteID;

  it('should create another note in response to same note', function (done) {

    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': submissionInvitation,
      'replyto': noteid,
      'forum': noteid,
      'signatures': ['~Super_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'pdfTransfer': 'url',
      'content': {
        'comment': 'subnote2'
      }
    })
    .end(function (err, res) {
      secondNoteID = res.body.id;
      done();
    });
  });

  it('should search for "subnote" over all content and should find two notes', function (done) {
    chai.request(server)
    .get('/notes/search?term=subnote&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].content.comment.should.contain('subnote2');
      res.body.notes[1].content.comment.should.contain('subnote1');
      done();
    });
  });

  it('should search for "SHOULD SUCCEED" over all content and should find three notes with replyCount higher than zero', function (done) {
    chai.request(server)
    .get('/notes/search?term=SHOULD+SUCCEED&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(3);
      res.body.notes[0].content.title.should.contain('SHOULD SUCCEED');
      //res.body.notes[0].replyCount.should.equals(0);
      res.body.notes[1].content.title.should.contain('SHOULD SUCCEED');
      //res.body.notes[1].replyCount.should.equals(0);
      res.body.notes[2].content.title.should.contain('SHOULD SUCCEED');
      //res.body.notes[2].replyCount.should.equals(2);
      done();
    });
  });

  it('should delete the second sub note', function (done) {
    // ACS: why is deleting a note done via /post

    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': submissionInvitation,
      'signatures': ['~Super_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'id': secondNoteID,
      'ddate': Date.now()
    })
    .end(function (err, res) {
      res.should.have.status(200);
      done();
    });
  });

  it('should search for "subnote" over all content and should find one note, the other was deleted', function (done) {
    chai.request(server)
    .get('/notes/search?term=subnote&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.comment.should.contain('subnote1');
      done();
    });
  });

  it('should delete the forum that has sub notes', function (done) {
    // ACS: I don't understand this forum deletion via post /notes
    var noteData;
    chai.request(server)
    .get('/notes?id=' + noteid)
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.notes.length.should.equal(1);
      res.body.notes[0].id.should.equal(noteid);

      noteData = _.merge(res.body.notes[0], {ddate: Date.now()});

      chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send(noteData)
      .end(function (err, res) {
        res.should.have.status(200);
        res.body.should.have.property('ddate');
        done();
      });
    });
  });

  it('should search for "subnote" over all content and should not find any because forum was deleted', function (done) {
    chai.request(server)
    .get('/notes/search?term=subnote&content=all')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].invitation.should.equal('ICC.cc/-/submission');
      res.body.notes[0].forum.should.not.equal(res.body.notes[0].id);
      should.equal(res.body.notes[0].ddate, null);
      res.body.notes[0].forumContent.should.eql({});
      done();
    });
  });

  it('should search notes with a limit', function (done) {
    chai.request(server)
    .get('/notes')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(6);
      return chai.request(server)
      .get('/notes?trash=true')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(8);
      return chai.request(server)
      .get('/notes/search?term=tes&content=all&limit=2')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      return chai.request(server)
      .get('/notes/search?term=tes&content=all&limit=2')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      return chai.request(server)
      .get('/notes/search?term=tes&content=all&limit=6&offset=3')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      done();
    })
    .catch(function(error) {
      done(error);
    })

  });

  it('should search notes by author name and get the exact match', function (done) {
    utils.createGroupP('ICC.cc', superUser, superToken, ['everyone'])
    .then(function(result){
      return utils.createInvitationP('ICC.cc/-/submission', 'ICC.cc', superToken, {}, { values: ['everyone'] });
    })
    .then(function(result){
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
              'title': 'Feature Learning in Deep Neural Networks - A Study on Speech Recognition\r\n    Tasks',
              'abstract': 'The abstract of test paper 1',
              'authors': ['Andrew Mitchell', 'Michael McCallum'],
              'author_emails': ['test@host.com', 'mccallum@mail.com'],
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          });
    })
    .then(function(result){
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
              'title': 'Another paper 2',
              'abstract': 'The abstract of test paper 2',
              'authors': ['Test host', 'Andrew McCallum'],
              'author_emails': ['test@host.com', 'mccallum@mail.com'],
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          });
    })
    .then(function(result) {
      return chai.request(server)
      .get('/notes/search?term=andrew+mccallum&content=all')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.equal('Another paper 2');
      //res.body.notes[1].content.title.should.equal('Feature Learning in Deep Neural Networks - A Study on Speech Recognition\r\n    Tasks');
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });

  it('should search notes by author using the profile emails and get the exact match', function (done) {

    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
    })
    .then(function(res) {
      return chai.request(server)
        .put('/activate/melisa@gmail.com')
        .send({
          content: {
            names: [
              {
                first: 'Melisa',
                last: 'Bok',
                username: '~Melisa_Bok1'
              }
            ],
            preferredEmail: 'melisa@gmail.com',
            emails: ['melisa@gmail.com', 'melisaalternate@gmail.com']
          }
        });
    })
    .then(function(res) {
      return chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa@umass.edu',
        password: '1111111',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
      });
    })
    .then(function(res) {
      return chai.request(server)
        .put('/activate/melisa@umass.edu')
        .send({
          content: {
            names: [
              {
                first: 'Melisa',
                last: 'Bok',
                username: '~Melisa_Bok2'
              },
              {
                first: 'Melisa',
                middle: 'Middle',
                last: 'Bok',
                username: '~Melisa_Middle_Bok1'
              }
            ],
            preferredEmail: 'melisa@umass.edu',
            emails: ['melisa@umass.edu']
          }
        });
    })
    .then(function(result){
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
              'title': 'Feature Learning in Deep Neural Networks - A Study on Speech Recognition\r\n    Tasks',
              'abstract': 'The abstract of test paper 1',
              'authors': ['Melisa Bok'],
              'authorids': ['melisa@gmail.com'],
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          });
    })
    .then(function(result){
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
              'title': 'Another paper 2',
              'abstract': 'The abstract of test paper 2',
              'authors': ['Melisa Bok', 'Andrew McCallum'],
              'authorids': ['melisa@umass.edu', 'mccallum@mail.com'],
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          });
    })
    .then(function(result){
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
              'title': 'Another paper 3',
              'abstract': 'The abstract of test paper 3',
              'authors': ['Melisa Bok', 'Andrew McCallum'],
              'authorids': ['melisaalternate@gmail.com', 'mccallum@mail.com'],
              'pdf': 'http://arxiv.org/pdf/1506.03425v1.pdf'
            }
          });
    })
    .then(function(result) {
      return chai.request(server)
      .get('/notes/search?term=~Melisa_Bok1&content=authors')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].content.title.should.equal('Another paper 3');
      res.body.notes[1].content.title.should.equal('Feature Learning in Deep Neural Networks - A Study on Speech Recognition\r\n    Tasks');
      return chai.request(server)
      .get('/notes?content.authorids=~Melisa_Bok1')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(2);
      res.body.notes[0].content.title.should.equal('Another paper 3');
      res.body.notes[1].content.title.should.equal('Feature Learning in Deep Neural Networks - A Study on Speech Recognition\r\n    Tasks');
      return chai.request(server)
      .get('/notes/search?term=~Melisa_Bok2&content=authors')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.equal('Another paper 2');
      return chai.request(server)
      .get('/notes?content.authorids=~Melisa_Middle_Bok1')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.equal('Another paper 2');
      return chai.request(server)
      .get('/notes/search?term=~Melisa_Middle_Bok1&content=authors')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equal(1);
      res.body.notes[0].content.title.should.equal('Another paper 2');
      done();
    })
    .catch(function(error) {
      done(error);
    })
  });

});
