var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');


chai.use(chaiHttp);

describe('NotesTransformation', function() {

	var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var user = 'test@test.com';
  var noteId;

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


  it('should create a reference with the original content, another reference with the transformed content and the final note', function(done) {

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: true
      }
    };

    var transform = function(note) {

    	var newContent = {
    		title: note.content.dblp.toUpperCase()
    	};

    	note.content = newContent;

    	return note;
    };

    utils.createGroupP('Test1.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
		    .post('/invitations')
		    .set('Authorization', 'Bearer ' + superToken)
		    .set('User-Agent', 'test-create-script')
		    .send({
		      id: 'Test1.cc/-/dblp-upload',
		      signatures: [user],
		      writers: [user],
		      invitees: ['~'],
		      readers: ['everyone'],
		      nonreaders: [],
		      reply : {
		        readers: { values: ['everyone'] },
		        signatures: { 'values-regex': '.+' },
		        writers: { 'values-regex': '.+' },
		        nonreaders: { 'values-regex': '.*' },
		        content: origContent
		      },
		      transform: transform + ''
		    });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test1.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('TEST PAPER TITLE');
      res.body.content.should.not.have.property('dblp');
      var noteId = res.body.id;
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
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ title: 'TEST PAPER TITLE' });
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'test paper title' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a reference with no transformation function and get the regular note', function(done) {

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: true
      }
    };

    utils.createGroupP('Test2.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
		    .post('/invitations')
		    .set('Authorization', 'Bearer ' + superToken)
		    .set('User-Agent', 'test-create-script')
		    .send({
		      id: 'Test2.cc/-/dblp-upload',
		      signatures: [user],
		      writers: [user],
		      invitees: ['~'],
		      readers: ['everyone'],
		      nonreaders: [],
		      reply : {
		        readers: { values: ['everyone'] },
		        signatures: { 'values-regex': '.+' },
		        writers: { 'values-regex': '.+' },
		        nonreaders: { 'values-regex': '.*' },
		        content: origContent
		      }
		    });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test2.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('dblp');
      res.body.content.should.not.have.property('title');
      res.body.content.dblp.should.equals('test paper title');
      var noteId = res.body.id;
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
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'test paper title' });
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(0);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should create a reference with identity transformation function and get the regular note', function(done) {

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: true
      }
    };

    var transform = function(note) {
    	return note;
    };

    utils.createGroupP('Test3.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
		    .post('/invitations')
		    .set('Authorization', 'Bearer ' + superToken)
		    .set('User-Agent', 'test-create-script')
		    .send({
		      id: 'Test3.cc/-/dblp-upload',
		      signatures: [user],
		      writers: [user],
		      invitees: ['~'],
		      readers: ['everyone'],
		      nonreaders: [],
		      reply : {
		        readers: { values: ['everyone'] },
		        signatures: { 'values-regex': '.+' },
		        writers: { 'values-regex': '.+' },
		        nonreaders: { 'values-regex': '.*' },
		        content: origContent
		      },
		      transform: transform + ''
		    });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test3.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('dblp');
      res.body.content.dblp.should.equals('test paper title');
      res.body.content.should.not.have.property('title');
      var noteId = res.body.id;
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
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'test paper title' });
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(0);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should update a note built from a transformation', function(done) {

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: false
      }
    };

    var transform = function(note) {

    	var newContent = {
    		title: note.content.dblp.toUpperCase()
    	};

    	note.content = newContent;

    	return note;
    };

    utils.createGroupP('Test4.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
		    .post('/invitations')
		    .set('Authorization', 'Bearer ' + superToken)
		    .set('User-Agent', 'test-create-script')
		    .send({
		      id: 'Test4.cc/-/dblp-upload',
		      signatures: [user],
		      writers: [user],
		      invitees: ['~'],
		      readers: ['everyone'],
		      nonreaders: [],
		      reply : {
		        readers: { values: ['everyone'] },
		        signatures: { 'values-regex': '.+' },
		        writers: { 'values-regex': '.+' },
		        nonreaders: { 'values-regex': '.*' },
		        content: origContent
		      },
		      transform: transform + ''
		    });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test4.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('TEST PAPER TITLE');
      res.body.content.should.not.have.property('dblp');
      var noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
      	id: noteId,
        invitation: 'Test4.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: 'test paper title second version'
        }
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
    	var noteId = res.body.id;
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
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ title: 'TEST PAPER TITLE SECOND VERSION' });
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'test paper title second version' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should add a revision to a transformed note', function(done) {

    var content = {
      'title': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'paper title.',
        required: false
      }
    };

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: false
      }
    };

    var transform = function(note) {

    	var newContent = {
    		title: note.content.dblp.toUpperCase()
    	};

    	note.content = newContent;

    	return note;
    };

    utils.createGroupP('Test5.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
		    .post('/invitations')
		    .set('Authorization', 'Bearer ' + superToken)
		    .set('User-Agent', 'test-create-script')
		    .send({
		      id: 'Test5.cc/-/dblp-upload',
		      signatures: [user],
		      writers: [user],
		      invitees: ['~'],
		      readers: ['everyone'],
		      nonreaders: [],
		      reply : {
		        readers: { values: ['everyone'] },
		        signatures: { 'values-regex': '.+' },
		        writers: { 'values-regex': '.+' },
		        nonreaders: { 'values-regex': '.*' },
		        content: origContent
		      },
		      transform: transform + ''
		    });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test5.cc/-/add-revision',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: content
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test5.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('TEST PAPER TITLE');
      res.body.content.should.not.have.property('dblp');
      var noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
      	referent: noteId,
        invitation: 'Test5.cc/-/add-revision',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	title: 'TEST PAPER TITLE SECOND VERSION'
        }
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
      return chai.request(server)
      .get('/references?referent=' + res.body.referent)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(2);
      res.body.references[0].content.should.eql({ title: 'TEST PAPER TITLE SECOND VERSION' });
      res.body.references[1].content.should.eql({ title: 'TEST PAPER TITLE' });
      var refId = res.body.references[1].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'test paper title' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

   it('should add a transformed revision to a regular note', function(done) {

    var content = {
      'title': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'paper title.',
        required: false
      }
    };

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: false
      }
    };

    var transform = function(note) {

      var newContent = {
        title: note.content.dblp.toUpperCase()
      };

      note.content = newContent;

      return note;
    };

    utils.createGroupP('Test6.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test6.cc/-/dblp-upload',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: content
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test6.cc/-/add-revision',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: origContent
          },
          transform: transform + ''
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test6.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          title: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('test paper title');
      res.body.content.should.not.have.property('dblp');
      var noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        referent: noteId,
        invitation: 'Test6.cc/-/add-revision',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          dblp: 'dblp paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .get('/notes?id=' + res.body.referent)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.length.should.equals(1);
      res.body.notes[0].content.should.have.property('title');
      res.body.notes[0].content.title.should.equals('DBLP PAPER TITLE');
      res.body.notes[0].content.should.not.have.property('dblp');
      return chai.request(server)
      .get('/references?referent=' + res.body.notes[0].id)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(2);
      res.body.references[0].content.should.eql({ title: 'DBLP PAPER TITLE' });
      res.body.references[1].content.should.eql({ title: 'test paper title' });
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'dblp paper title' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

   it('should edit a transformed revision and update the regular note', function(done) {

    var content = {
      'title': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'paper title.',
        required: false
      }
    };

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: false
      }
    };

    var transform = function(note) {

      var newContent = {
        title: note.content.dblp.toUpperCase()
      };

      note.content = newContent;

      return note;
    };

    utils.createGroupP('Test7.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test7.cc/-/dblp-upload',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: content
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test7.cc/-/add-revision',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: origContent
          },
          transform: transform + ''
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test7.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          title: 'test paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('test paper title');
      res.body.content.should.not.have.property('dblp');
      var noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        referent: noteId,
        invitation: 'Test7.cc/-/add-revision',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          dblp: 'dblp paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: res.body.id,
        referent: res.body.referent,
        invitation: 'Test7.cc/-/add-revision',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          dblp: 'updated dblp paper title'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .get('/notes?id=' + res.body.referent)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('notes');
      res.body.notes.length.should.equals(1);
      res.body.notes[0].content.should.have.property('title');
      res.body.notes[0].content.title.should.equals('UPDATED DBLP PAPER TITLE');
      res.body.notes[0].content.should.not.have.property('dblp');
      return chai.request(server)
      .get('/references?referent=' + res.body.notes[0].id)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(2);
      res.body.references[0].content.should.eql({ title: 'UPDATED DBLP PAPER TITLE' });
      res.body.references[1].content.should.eql({ title: 'test paper title' });
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'updated dblp paper title' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });
/*
   it('should add a transformed revision to a regular note using the paperhash', function(done) {
    var noteId;
    var content = {
      'title': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'paper title.',
        required: true
      },
      'authors': {
        'order': 1,
        'value-regex': '[^,\\n]+(,[^,\\n]+)*',
        'description': 'List of authors',
        required: true
      }
    };

    var origContent = {
      'dblp': {
        'order': 1,
        'value-regex': '.{1,100}',
        'description': 'DBLP data.',
        required: false
      }
    };

    var transform = function(note) {

      var newContent = {
        title: 'test paper title',
        authors: ['Melisa Bok']
      };

      note.content = newContent;

      return note;
    };

    utils.createGroupP('Test8.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test8.cc/-/submission',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: content
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'Test8.cc/-/dblp-upload',
          signatures: [user],
          writers: [user],
          invitees: ['~'],
          readers: ['everyone'],
          nonreaders: [],
          reply : {
            readers: { values: ['everyone'] },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            nonreaders: { 'values-regex': '.*' },
            content: origContent
          },
          transform: transform + ''
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test8.cc/-/submission',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          title: 'test paper title',
          authors: ['Melisa Bok', 'Michael Spector']
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('test paper title');
      res.body.content.authors.should.eql(['Melisa Bok', 'Michael Spector']);
      res.body.content.should.not.have.property('dblp');
      noteId = res.body.id;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test8.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
          dblp: 'test paper title|Melisa Bok'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equals(noteId);
      res.body.invitation.should.equals('Test8.cc/-/submission');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.title.should.equals('test paper title');
      res.body.content.authors.should.eql(['Melisa Bok']);
      res.body.content.should.not.have.property('dblp');
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
      res.body.notes.length.should.equals(1);
      res.body.notes[0].invitation.should.equals('Test8.cc/-/submission');
      res.body.notes[0].content.should.have.property('title');
      res.body.notes[0].content.title.should.equals('test paper title');
      res.body.notes[0].content.should.not.have.property('dblp');
      return chai.request(server)
      .get('/references?referent=' + res.body.notes[0].id)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(2);
      res.body.references[0].content.title.should.equals('test paper title');
      res.body.references[0].invitation.should.equals('Test8.cc/-/dblp-upload');
      res.body.references[1].content.title.should.equals('test paper title');
      res.body.references[1].invitation.should.equals('Test8.cc/-/submission');
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: 'test paper title|Melisa Bok' });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });
*/
  it('should a transformed note with real dblp data', function(done) {

		var dblp1 = `<article key="journals/aiedam/PenciucDDVE16" mdate="2016 08 22">
	   <author>Diana krishnan</author>
	   <author orcid="0000 0001 8723 2506">Julien Le Duigou</author>
	   <author>Joanna Daaboul</author>
	   <author>Flore A. Vallet</author>
	   <author>Benoît Eynard 0001</author>
	   <title>
	   Deep kalman filters.
	   </title>
	   <pages>379 389</pages>
	   <year>2016</year>
	   <volume>30</volume>
	   <journal>AI EDAM</journal>
	   <number>4</number>
	   <ee>https://doi.org/10.1017/S08900604160003663</ee>
	   <url>db/journals/aiedam/aiedam30.html#PenciucDDVE16</url>
	   </article>`;


    var origContent = {
      'dblp': {
        'order': 1,
        'value regex': '(.|\n)*',
        'description': 'DBLP data.',
        required: false
      }
    };

    var transform = function (note) {
      var removeDigitsRegEx = /\s\d{4}$/;
      var et = require('elementtree');
      var XML = et.XML;
      var tree = new et.ElementTree(XML(note.content.dblp));

      // get the entity type
      var entityType = tree.getroot().tag;

      var titleElement = tree.find('./title');
      // DBLP likes to end titles with a period, strip that off.
      var title = titleElement.text.trim();

      // see if we have a modification date
      // if there is no mdate, user the 'year' field.
      var year = tree.find('./year');
      var dttm = Date.parse(tree.getroot().attrib.mdate + ' 00:00:00 GMT' || year.text);
      var key = tree.getroot().attrib.key;

      var json = {
        'entityType': entityType,
        'key': key
      };

      var _authors = tree.findall('./author');
      var authors = [];
      _authors.forEach( function (author) {
        authors.push(author.text.replace(removeDigitsRegEx, ''));
      });

      if (authors.length > 0) {
        json.authors = authors;
      }

      var _editors = tree.findall('./editor');
      var editors = [];
      _editors.forEach(function (editor) {
        editors.push(editor.text);
      });

      if (editors.length > 0) {
        json.editors = editors;
      }

      // get all tags in the entity
      tree.getroot()._children.forEach(function (rec) {
        if (rec.tag !== 'author' && rec.tag !== 'editor') {
          json[rec.tag] = rec.text;
        }

      });

      note.cdate = dttm;
      note.content = json;
      note.content.title = title;
      return note;
    };

    utils.createGroupP('Test6.cc', superUser, superToken, ['everyone'])
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
		    .post('/invitations')
		    .set('Authorization', 'Bearer ' + superToken)
		    .set('User-Agent', 'test-create-script')
		    .send({
		      id: 'Test6.cc/-/dblp-upload',
		      signatures: [user],
		      writers: [user],
		      invitees: ['~'],
		      readers: ['everyone'],
		      nonreaders: [],
		      reply : {
		        readers: { values: ['everyone'] },
		        signatures: { 'values-regex': '.+' },
		        writers: { 'values-regex': '.+' },
		        nonreaders: { 'values-regex': '.*' },
		        content: origContent
		      },
		      transform: transform + ''
		    });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        invitation: 'Test6.cc/-/dblp-upload',
        signatures: ['~Test_User1'],
        writers: ['~Test_User1'],
        readers: ['everyone'],
        content: {
        	dblp: dblp1
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.should.have.property('authors');
      res.body.content.should.have.property('paperhash');
      res.body.content.should.have.property('key');
      res.body.content.should.have.property('entityType');
      res.body.content.should.have.property('pages');
      res.body.content.should.have.property('year');
      res.body.content.should.have.property('volume');
      res.body.content.should.have.property('journal');
      res.body.content.should.have.property('number');
      res.body.content.should.have.property('ee');
      res.body.content.title.should.equals('Deep kalman filters.');
      res.body.content.authors.should.eql(['Diana krishnan', 'Julien Le Duigou', 'Joanna Daaboul', 'Flore A. Vallet', 'Benoît Eynard']);
      res.body.content.paperhash.should.eql('krishnan|deep_kalman_filters');
      res.body.cdate.should.equal(1471824000000); // GMT: Monday, August 22, 2016 12:00:00 AM
      res.body.content.should.not.have.property('dblp');
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
      res.body.references.length.should.equals(1);
      res.body.references[0].content.title.should.equals('Deep kalman filters.');
      var refId = res.body.references[0].id;
      return chai.request(server)
      .get('/references?referent=' + refId)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.eql({ dblp: dblp1 });
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

  it('should edit the transformation function and re-execute the function when the reference is edited', function(done) {

    var reference;
    var transform = function (note) {
      var removeDigitsRegEx = /\s\d{4}$/;
      var et = require('elementtree');
      var XML = et.XML;
      var tree = new et.ElementTree(XML(note.content.dblp));

      // get the entity type
      var entityType = tree.getroot().tag;

      var titleElement = tree.find('./title');
      // DBLP likes to end titles with a period, strip that off.
      var title = titleElement.text.trim();

      // see if we have a modification date
      // if there is no mdate, user the 'year' field.
      var year = tree.find('./year');
      var dttm = Date.parse(tree.getroot().attrib.mdate + ' 00:00:00 GMT' || year.text);
      var key = tree.getroot().attrib.key;

      var json = {
        '_entityType': entityType,
        '_key': key
      };

      var _authors = tree.findall('./author');
      var authors = [];
      _authors.forEach( function (author) {
        authors.push(author.text.replace(removeDigitsRegEx, ''));
      });

      if (authors.length > 0) {
        json.authors = authors;
      }

      var _editors = tree.findall('./editor');
      var editors = [];
      _editors.forEach(function (editor) {
        editors.push(editor.text);
      });

      if (editors.length > 0) {
        json._editors = editors;
      }

      // get all tags in the entity
      tree.getroot()._children.forEach(function (rec) {
        if (rec.tag !== 'author' && rec.tag !== 'editor') {
          json['_' + rec.tag] = rec.text;
        }

      });

      note.cdate = dttm;
      note.content = json;
      note.content.title = title;
      return note;
    };

    chai.request(server)
    .post('/invitations')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'Test6.cc/-/dblp-upload',
      signatures: [user],
      writers: [user],
      invitees: ['~'],
      readers: ['everyone'],
      nonreaders: [],
      reply : {
        readers: { values: ['everyone'] },
        signatures: { 'values-regex': '.+' },
        writers: { 'values-regex': '.+' },
        nonreaders: { 'values-regex': '.*' },
        content: {
          dblp: {
            'order': 1,
            'value-regex': '(.|\n)*',
            'description': 'DBLP data.',
            required: false
          }
        }
      },
      transform: transform + ''
    })
    .then(function(response) {
      response.should.have.status(200);
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
      res.body.references.length.should.equals(1);
      res.body.references[0].content.title.should.equals('Deep kalman filters.');
      reference = res.body.references[0];
     return chai.request(server)
      .get('/references?referent=' + reference.id)
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equals(1);
      res.body.references[0].content.should.have.property('dblp');
      reference.content = res.body.references[0].content;
      return chai.request(server)
      .post('/notes')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send(reference);
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body.content.should.have.property('title');
      res.body.content.should.have.property('authors');
      res.body.content.should.have.property('paperhash');
      res.body.content.should.not.have.property('key');
      res.body.content.should.not.have.property('entityType');
      res.body.content.should.not.have.property('pages');
      res.body.content.should.not.have.property('year');
      res.body.content.should.not.have.property('volume');
      res.body.content.should.not.have.property('journal');
      res.body.content.should.not.have.property('number');
      res.body.content.should.not.have.property('ee');
      res.body.content.should.have.property('_key');
      res.body.content.should.have.property('_entityType');
      res.body.content.should.have.property('_pages');
      res.body.content.should.have.property('_year');
      res.body.content.should.have.property('_volume');
      res.body.content.should.have.property('_journal');
      res.body.content.should.have.property('_number');
      res.body.content.should.have.property('_ee');
      res.body.content.title.should.equals('Deep kalman filters.');
      res.body.content.authors.should.eql(['Diana krishnan', 'Julien Le Duigou', 'Joanna Daaboul', 'Flore A. Vallet', 'Benoît Eynard']);
      res.body.content.paperhash.should.eql('krishnan|deep_kalman_filters');
      res.body.cdate.should.equal(1471824000000); // GMT: Monday, August 22, 2016 12:00:00 AM
      res.body.content.should.not.have.property('dblp');
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
      res.body.notes.length.should.equals(1);
      res.body.notes[0].should.have.property('id');
      res.body.notes[0].should.have.property('content');
      res.body.notes[0].content.should.have.property('title');
      res.body.notes[0].content.should.have.property('authors');
      res.body.notes[0].content.should.have.property('paperhash');
      res.body.notes[0].content.should.not.have.property('key');
      res.body.notes[0].content.should.not.have.property('entityType');
      res.body.notes[0].content.should.not.have.property('pages');
      res.body.notes[0].content.should.not.have.property('year');
      res.body.notes[0].content.should.not.have.property('volume');
      res.body.notes[0].content.should.not.have.property('journal');
      res.body.notes[0].content.should.not.have.property('number');
      res.body.notes[0].content.should.not.have.property('ee');
      res.body.notes[0].content.should.have.property('_key');
      res.body.notes[0].content.should.have.property('_entityType');
      res.body.notes[0].content.should.have.property('_pages');
      res.body.notes[0].content.should.have.property('_year');
      res.body.notes[0].content.should.have.property('_volume');
      res.body.notes[0].content.should.have.property('_journal');
      res.body.notes[0].content.should.have.property('_number');
      res.body.notes[0].content.should.have.property('_ee');
      res.body.notes[0].content.title.should.equals('Deep kalman filters.');
      res.body.notes[0].content.authors.should.eql(['Diana krishnan', 'Julien Le Duigou', 'Joanna Daaboul', 'Flore A. Vallet', 'Benoît Eynard']);
      res.body.notes[0].content.paperhash.should.eql('krishnan|deep_kalman_filters');
      res.body.notes[0].cdate.should.equal(1471824000000); // GMT: Monday, August 22, 2016 12:00:00 AM
      res.body.notes[0].content.should.not.have.property('dblp');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  })

});
