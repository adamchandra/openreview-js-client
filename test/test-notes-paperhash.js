var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

var should = chai.should();
chai.use(chaiHttp);

describe('NotesPaperhash', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  var noteId;
  var overwritenId;

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
/*
  it('should create a note of paper and add a new reference with the same paperhash', function(done) {
    utils.createGroupP('ab.com', superUser, superToken, ['everyone'])
    .then(function(res) {
      res.should.have.status(200);
      return utils.createInvitationP('ab.com/-/submission', 'ab.com', superToken, {
        title: {
          'order': 3,
          'value-regex': '.{1,100}',
          'description': 'Title of paper.'
        },
        abstract: {
          'order': 4,
          'value-regex': '[\\S\\s]{1,5000}',
          'description': 'Abstract of paper.'
        },
        authors: {
          'order': 1,
          'values-regex': '[^,\\n]+(,[^,\\n]+)*',
          'description': 'Comma separated list of author names, as they appear in the paper.'
        },
        authorids: {
          'order': 2,
          'values-regex': '([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
          'description': 'Comma separated list of author email addresses, in the same order as above.'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return utils.createInvitationP('ab.com/-/othersubmission', 'ab.com', superToken, {
        title: {
          'order': 3,
          'value-regex': '.{1,100}',
          'description': 'Title of paper.'
        },
        abstract: {
          'order': 4,
          'value-regex': '[\\S\\s]{1,5000}',
          'description': 'Abstract of paper.'
        },
        authors: {
          'order': 1,
          'values-regex': '[^,\\n]+(,[^,\\n]+)*',
          'description': 'Comma separated list of author names, as they appear in the paper.'
        },
        authorids: {
          'order': 2,
          'values-regex': '([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,},){0,}([a-z0-9_\\-\\.]{2,}@[a-z0-9_\\-\\.]{2,}\\.[a-z]{2,})',
          'description': 'Comma separated list of author email addresses, in the same order as above.'
        }
      }, { values: ['~'] });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ab.com/-/submission',
          'forum': null,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            title: 'this is my title',
            abstract: 'this is an abstract',
            authorids: ['mbok@mail.com', 'spector@mail.com'],
            authors: ['Melisa Bok', 'Michael Spector']
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
      res.body.forum.should.be.a('string');
      res.body.forum.should.equals(res.body.id);
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|this_is_my_title');
      res.body.content.abstract.should.equals('this is an abstract');
      res.body.content.authorids.should.eql(['mbok@mail.com', 'spector@mail.com']);
      res.body.content.authors.should.eql(['Melisa Bok', 'Michael Spector']);
      noteId = res.body.id;
      return chai.request(server)
        .get('/references?referent=' + noteId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equals(1);
      res.body.references[0].referent.should.equals(noteId);
      res.body.references[0].forum.should.equals(noteId);
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'invitation': 'ab.com/-/othersubmission',
          'forum': null,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['~'],
          'content': {
            title: 'this is my title',
            abstract: 'this is an different abstract',
            authorids: ['mbok@mail.com', 'spector@mail.com', 'mccallum@umass.edu'],
            authors: ['Melisa Bok', 'Michael Spector', 'Andrew McCallum']
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.equals(noteId);
      res.body.forum.should.be.a('string');
      res.body.forum.should.equals(noteId);
      res.body.readers.should.eql(['everyone']);
      res.body.invitation.should.equals('ab.com/-/submission');
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|this_is_my_title');
      res.body.content.abstract.should.equals('this is an different abstract');
      res.body.content.authorids.should.eql(['mbok@mail.com', 'spector@mail.com', 'mccallum@umass.edu']);
      res.body.content.authors.should.eql(['Melisa Bok', 'Michael Spector', 'Andrew McCallum']);
      return chai.request(server)
        .get('/notes?id=' + noteId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equals(1);
      res.body.notes[0].id.should.equals(noteId);
      res.body.notes[0].forum.should.equals(noteId);
      res.body.notes[0].content.should.have.property('paperhash');
      res.body.notes[0].content.paperhash.should.equals('bok|this_is_my_title');
      res.body.notes[0].content.authors.should.eql(['Melisa Bok', 'Michael Spector', 'Andrew McCallum']);
      return chai.request(server)
        .get('/references?referent=' + noteId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equals(2);
      res.body.references[0].referent.should.equals(noteId);
      res.body.references[0].forum.should.equals(noteId);
      res.body.references[0].content.paperhash.should.equals('bok|this_is_my_title');
      res.body.references[0].content.abstract.should.equals('this is an different abstract');
      res.body.references[0].content.authorids.should.eql(['mbok@mail.com', 'spector@mail.com', 'mccallum@umass.edu']);
      res.body.references[0].content.authors.should.eql(['Melisa Bok', 'Michael Spector', 'Andrew McCallum']);
      res.body.references[0].invitation.should.equals('ab.com/-/othersubmission');
      res.body.references[0].readers.should.eql(['~']);
      res.body.references[1].referent.should.equals(noteId);
      res.body.references[1].forum.should.equals(noteId);
      res.body.references[1].content.paperhash.should.equals('bok|this_is_my_title');
      res.body.references[1].content.abstract.should.equals('this is an abstract');
      res.body.references[1].content.authorids.should.eql(['mbok@mail.com', 'spector@mail.com']);
      res.body.references[1].content.authors.should.eql(['Melisa Bok', 'Michael Spector']);
      res.body.references[1].invitation.should.equals('ab.com/-/submission');
      res.body.references[1].readers.should.eql(['everyone']);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a overwriting note with the same paperhash and create a new note', function(done) {
    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': 'ab.com/-/submission',
      'forum': null,
      'original': noteId,
      'signatures': ['~Test_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'content': {
        abstract: 'overwrite this is abstract'
      }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|this_is_my_title');
      res.body.content.abstract.should.equals('overwrite this is abstract');
      res.body.content.authorids.should.eql(['mbok@mail.com', 'spector@mail.com', 'mccallum@umass.edu']);
      res.body.should.not.have.property('referent');
      overwritenId = res.body.id;
      return chai.request(server)
        .get('/references?referent=' + res.body.id)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equals(1);
      return chai.request(server)
        .get('/references?referent=' + noteId)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equals(2);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should create a overwriting note with the different paperhash and create a new note', function(done) {
    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': 'ab.com/-/submission',
      'forum': null,
      'original': noteId,
      'signatures': ['~Test_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'content': {
        authors: ['Other Name'],
        authorids: ['other@mail.com'],
        abstract: 'overwrite this is abstract'
      }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('name|this_is_my_title');
      res.body.content.abstract.should.equals('overwrite this is abstract');
      res.body.content.authorids.should.eql(['other@mail.com']);
      res.body.should.not.have.property('referent');
      return chai.request(server)
        .get('/references?referent=' + res.body.id)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equals(1);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should update a note with a paperhash of another existent note and add a revision to the updated note', function(done) {
    var id;
    chai.request(server)
    .post('/notes')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      'invitation': 'ab.com/-/submission',
      'forum': null,
      'signatures': ['~Test_User1'],
      'writers': ['~Test_User1'],
      'readers': ['everyone'],
      'content': {
        title: 'this is another title',
        abstract: 'this is an abstract',
        authorids: ['mbok@mail.com', 'spector@mail.com'],
        authors: ['Melisa Bok', 'Michael Spector']
      }
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.not.equals('');
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|this_is_another_title');
      res.body.should.not.have.property('referent');
      id = res.body.id;
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': res.body.id,
          'invitation': 'ab.com/-/submission',
          'forum': res.body.id,
          'signatures': ['~Test_User1'],
          'writers': ['~Test_User1'],
          'readers': ['everyone'],
          'content': {
            title: 'this is my title',
            abstract: 'this is an abstract',
            authorids: ['mbok@mail.com', 'spector@mail.com'],
            authors: ['Melisa Bok', 'Michael Spector']
          }
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.be.a('string');
      res.body.id.should.equals(id);
      res.body.forum.should.equals(id);
      res.body.content.should.have.property('paperhash');
      res.body.content.paperhash.should.equals('bok|this_is_my_title');
      res.body.should.not.have.property('referent');
      return chai.request(server)
        .get('/references?referent=' + id)
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.should.be.a('array');
      res.body.references.length.should.equals(1);
      return chai.request(server)
        .get('/notes?content.paperhash=bok|this_is_my_title')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.should.be.a('array');
      res.body.notes.length.should.equals(3);
      res.body.notes[0].id.should.equals(id);
      res.body.notes[1].id.should.equals(overwritenId);
      res.body.notes[2].id.should.equals(noteId);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });
*/
});
