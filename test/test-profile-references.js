var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');
var should = chai.should();
var _ = require('lodash');

chai.use(chaiHttp);


describe('ProfileReferences', function() {

  var server = utils.server;
  var superToken = '';
  var superUser = 'test@openreview.net';
  var testToken = '';
  var user = 'test@test.com';

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

  it('should add a new reference to a profile', function(done) {
    var token;
    var profile;
    chai.request(server)
    .post('/register')
    .set('User-Agent', 'test-create-script')
    .send({
      email: 'melisa@gmail.com',
      password: '12345678',
      name: {
        first: 'Melisa',
        middle: '',
        last: 'Bok'
      }
    })
    .then(function(response) {
      response.should.have.status(200);
      profile = response.body;
      return chai.request(server)
        .put('/activate/melisa@gmail.com')
        .send({
          content: {
            names: [
              {
                first: 'Melisa',
                middle: '',
                last: 'Bok',
                username: '~Melisa_Bok1',
                preferred: true
              }
            ],
            preferredEmail: 'melisa@gmail.com',
            emails: ['melisa@gmail.com'],
            history: [
              {
                position: 'Developer',
                start: 2016,
                institution: {
                  domain: 'cs.umass.edu',
                  name: 'Umass'
                }
              }
            ]
          }
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      return chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa@gmail.com',
        password: '12345678'
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      token = response.body.token;
      return chai.request(server)
        .get('/profiles')
        .set('Authorization', 'Bearer ' + token)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.profiles[0].id.should.equals('~Melisa_Bok1');
      return chai.request(server)
        .get('/references?referent=~Melisa_Bok1')
        .set('Authorization', 'Bearer ' + token)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(2);
      response.body.references[0].referent.should.equals('~Melisa_Bok1');
      response.body.references[0].content.should.have.property('history');
      response.body.references[0].readers.should.eql([superUser, '~Melisa_Bok1']);
      response.body.references[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[0].should.have.property('packaging');
      response.body.references[0].packaging.should.eql(profile);
      response.body.references[1].referent.should.equals('~Melisa_Bok1');
      response.body.references[1].content.should.have.property('emails');
      response.body.references[1].content.should.have.property('names');
      response.body.references[1].content.should.have.property('preferredEmail');
      response.body.references[1].readers.should.eql([superUser, '~Melisa_Bok1']);
      response.body.references[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[1].should.not.have.property('packaging');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          homepage: 'http://homepage.io'
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .send({
        referent: '~Melisa_Bok1',
        packaging: {
          id: '~Melisa_Bok1',
          test: 'other content'
        },
        content: {
          emails: ['another@mail.com'],
          history: [
            {
              position: 'Developer',
              start: 2016,
              end: null,
              institution: {
                domain: 'cs.umass.edu',
                name: 'Umass'
              }
            }
          ],
          relations: [
            {
              name: 'Michael Spector',
              email: 'spector@mail.com',
              relation: 'Coworker',
              start: 2015,
              end: null
             }
          ]
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      response.body.content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      response.body.content.history.length.should.equal(1);
      response.body.content.history[0].position.should.equal('Developer');
      response.body.content.history[0].start.should.equal(2016);
      should.equal(response.body.content.history[0].end, null);
      response.body.content.history[0].institution.domain.should.equal('cs.umass.edu');
      response.body.content.history[0].institution.name.should.equal('Umass');
      response.body.content.relations.length.should.equal(1);
      response.body.content.relations[0].name.should.equal('Michael Spector');
      response.body.content.relations[0].email.should.equal('spector@mail.com');
      response.body.content.relations[0].relation.should.equal('Coworker');
      response.body.content.relations[0].start.should.equal(2015);
      should.equal(response.body.content.relations[0].end, null);
      response.body.content.names.length.should.equal(1);
      response.body.content.names[0].first.should.equal('Melisa');
      response.body.content.names[0].middle.should.equal('');
      response.body.content.names[0].last.should.equal('Bok');
      response.body.content.names[0].username.should.equal('~Melisa_Bok1');
      response.body.content.names[0].preferred.should.equal(true);
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          names: [
            {
              first: 'Melisa',
              last: 'TestBok',
              middle: '',
              preferred: true
            }
          ]
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      response.body.content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      response.body.content.history.length.should.equal(1);
      response.body.content.history[0].position.should.equal('Developer');
      response.body.content.history[0].start.should.equal(2016);
      should.equal(response.body.content.history[0].end, null);
      response.body.content.history[0].institution.domain.should.equal('cs.umass.edu');
      response.body.content.history[0].institution.name.should.equal('Umass');
      response.body.content.relations.length.should.equal(1);
      response.body.content.relations[0].name.should.equal('Michael Spector');
      response.body.content.relations[0].email.should.equal('spector@mail.com');
      response.body.content.relations[0].relation.should.equal('Coworker');
      response.body.content.relations[0].start.should.equal(2015);
      should.equal(response.body.content.relations[0].end, null);
      response.body.content.names.length.should.equal(2);
      response.body.content.names[0].first.should.equal('Melisa');
      response.body.content.names[0].middle.should.equal('');
      response.body.content.names[0].last.should.equal('Bok');
      response.body.content.names[0].username.should.equal('~Melisa_Bok1');
      response.body.content.names[0].preferred.should.equal(false);
      response.body.content.names[1].first.should.equal('Melisa');
      response.body.content.names[1].middle.should.equal('');
      response.body.content.names[1].last.should.equal('TestBok');
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.content.names[1].preferred.should.equal(true);
      response.body.content.should.not.have.property('gscholar');
      response.body.content.should.not.have.property('expertise');
      return chai.request(server)
        .get('/groups?id=melisa@gmail.com')
        .set('Authorization', 'Bearer ' + token)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.groups[0].id.should.equals('melisa@gmail.com');
      response.body.groups[0].members.should.eql(['~Melisa_Bok1', '~Melisa_TestBok1']);
      return chai.request(server)
        .get('/groups?id=~Melisa_TestBok1')
        .set('Authorization', 'Bearer ' + token)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.groups[0].id.should.equals('~Melisa_TestBok1');
      response.body.groups[0].members.should.eql(['melisa@gmail.com']);
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          gscholar: 'http://scholar/mbok',
          history: [
            {
              position: 'Researcher',
              start: 2018,
              end: null,
              institution: {
                domain: 'cs.umass.edu',
                name: 'Computer Science Umass'
              }
            }
          ],
          relations: [
            {
              name: 'Andrew McCallum',
              email: 'mccallum@mail.com',
              relation: 'Advisor',
              start: 2018,
              end: null
            }
          ],
          expertise: [
            {
              keywords: ['machine learning'],
              start: 2016,
              end: null
            }
          ]
        },
        signatures: ['~Test_User1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      response.body.content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      response.body.content.history.length.should.equal(2);
      response.body.content.history[0].position.should.equal('Researcher');
      response.body.content.history[1].position.should.equal('Developer');
      response.body.content.relations.length.should.equal(2);
      response.body.content.names.length.should.equal(2);
      response.body.content.expertise.length.should.equal(1);
      response.body.content.gscholar.should.equals('http://scholar/mbok');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .send({
        referent: '~Melisa_Bok1',
        content: {
         relations: [
          {
            name: 'Javier Burroni',
            email: 'burroni@mail.com',
            relation: 'Spouse',
            start: 2014,
            end: null
          }
         ],
        },
        metaContent: {
          gscholar: {
            weights: [-1],
            values: ['http://scholar/mbok']
          },
          relations: {
            weights: [-1],
            values: [{
              name: 'Michael Spector',
              email: 'spector@mail.com',
              relation: 'Coworker',
              start: 2015,
              end: null
            }]
          }
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      response.body.metaContent.homepage.signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      response.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.emails[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.history.length.should.equal(2);
      response.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.emails[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.relations.length.should.equal(2);
      response.body.content.relations[0].name.should.equal('Andrew McCallum');
      response.body.content.relations[1].name.should.equal('Javier Burroni');
      response.body.metaContent.relations[0].signatures.should.eql(['~Test_User1']);
      response.body.metaContent.relations[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.names.length.should.equal(2);
      response.body.metaContent.names[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.names[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.expertise.length.should.equal(1);
      response.body.metaContent.expertise[0].signatures.should.eql(['~Test_User1']);
      response.body.content.should.not.have.property('gscholar');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          gscholar: 'http://another.gscholar.com'
        },
        signatures: ['~Test_User1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      response.body.metaContent.homepage.signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      response.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.emails[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.history.length.should.equal(2);
      response.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.emails[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.relations.length.should.equal(2);
      response.body.content.relations[0].name.should.equal('Andrew McCallum');
      response.body.content.relations[1].name.should.equal('Javier Burroni');
      response.body.metaContent.relations[0].signatures.should.eql(['~Test_User1']);
      response.body.metaContent.relations[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.names.length.should.equal(2);
      response.body.metaContent.names[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.names[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.expertise.length.should.equal(1);
      response.body.metaContent.expertise[0].signatures.should.eql(['~Test_User1']);
      response.body.content.should.not.have.property('gscholar');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          dblp: 'http://dblp/mbok'
        },
        signatures: ['~Test_User1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.body.id.should.equals('~Melisa_Bok1');
      response.body.active.should.equals(true);
      response.body.password.should.be.a('object');
      response.body.content.homepage.should.equals('http://homepage.io');
      response.body.content.dblp.should.equals('http://dblp/mbok');
      response.body.metaContent.homepage.signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      response.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.emails[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.history.length.should.equal(2);
      response.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.emails[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.relations.length.should.equal(2);
      response.body.content.relations[0].name.should.equal('Andrew McCallum');
      response.body.content.relations[1].name.should.equal('Javier Burroni');
      response.body.metaContent.relations[0].signatures.should.eql(['~Test_User1']);
      response.body.metaContent.relations[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.names.length.should.equal(2);
      response.body.metaContent.names[0].signatures.should.eql(['~Melisa_Bok1']);
      response.body.metaContent.names[1].signatures.should.eql(['~Melisa_Bok1']);
      response.body.content.expertise.length.should.equal(1);
      response.body.metaContent.expertise[0].signatures.should.eql(['~Test_User1']);
      response.body.content.should.not.have.property('gscholar');
      return chai.request(server)
        .get('/references?referent=~Melisa_Bok1')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('references');
      response.body.references.should.be.a('array');
      response.body.references.length.should.equal(9);
      response.body.references[0].referent.should.equals('~Melisa_Bok1');
      response.body.references[0].signatures.should.eql(['~Test_User1']);
      response.body.references[0].readers.should.eql([superUser, user]);
      response.body.references[0].tauthor.should.equals(user);
      response.body.references[0].should.have.property('packaging');
      response.body.references[1].signatures.should.eql(['~Test_User1']);
      response.body.references[1].tauthor.should.equals(user);
      response.body.references[1].should.have.property('packaging');
      response.body.references[2].referent.should.equals('~Melisa_Bok1');
      response.body.references[2].tauthor.should.equals('melisa@gmail.com');
      response.body.references[2].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[2].should.have.property('packaging');
      response.body.references[3].referent.should.equals('~Melisa_Bok1');
      response.body.references[3].tauthor.should.equals(user);
      response.body.references[3].signatures.should.eql(['~Test_User1']);
      response.body.references[3].should.have.property('packaging');
      response.body.references[4].referent.should.equals('~Melisa_Bok1');
      response.body.references[4].tauthor.should.equals('melisa@gmail.com');
      response.body.references[4].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[4].should.have.property('packaging');
      response.body.references[5].referent.should.equals('~Melisa_Bok1');
      response.body.references[5].tauthor.should.equals('melisa@gmail.com');
      response.body.references[5].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[5].should.have.property('packaging');
      response.body.references[5].packaging.should.eql({
        id: '~Melisa_Bok1',
        test: 'other content'
      });
      response.body.references[6].referent.should.equals('~Melisa_Bok1');
      response.body.references[6].tauthor.should.equals('melisa@gmail.com');
      response.body.references[6].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[6].should.have.property('packaging');
      response.body.references[7].tauthor.should.equals('melisa@gmail.com');
      response.body.references[7].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[7].should.have.property('packaging');
      response.body.references[8].tauthor.should.equals(superUser);
      response.body.references[8].signatures.should.eql(['~Melisa_Bok1']);
      response.body.references[8].should.not.have.property('packaging');
      done();

    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should add a new reference to a profile with no signatures rights an return an error', function(done) {
    chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          dblp: 'http://dblp/mbok'
        },
        signatures: ['~Melisa_Bok1']
      })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('notSignatory');
      response.body.should.have.property('errors');
      response.body.errors.should.be.a('array');
      response.body.errors.length.should.equal(1);
      response.body.errors[0].type.should.equal('notSignatory');
      response.body.errors[0].path.should.equal('signatures');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });


  it('should add a new reference to a profile as a guest user an return an error', function(done) {
    chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .send({
        referent: '~Melisa_Bok1',
        content: {
          dblp: 'http://dblp/mbok'
        },
        signatures: ['(guest)']
      })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('error');
      response.body.should.have.property('message');
      response.body.message.should.equal('Guest users can not edit profiles');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should add a new reference to a non existent profile an return an error', function(done) {
    chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        referent: '~No_Profile1',
        content: {
          dblp: 'http://dblp/mbok'
        },
        signatures: ['~Test_User1']
      })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('error');
      response.body.should.have.property('message');
      response.body.message.should.equal('Profile Not Found: ~No_Profile1');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });


  it('should try to update a profile that the user is not the owner and get an error', function(done) {
    chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        id: '~Melisa_Bok1',
        content: {
          dblp: 'http://dblp/mbok'
        },
        signatures: ['~Test_User1']
      })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.name.should.equal('error');
      response.body.should.have.property('message');
      response.body.message.should.equal('User is not the owner of the profile');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should try to update a profile as a super user', function(done) {
    chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        id: '~Melisa_Bok1',
        content: {
          emails: ['melisa@gmail.com'],
          preferredEmail: 'melisa@gmail.com',
          dblp: 'http://dblp/mbok'
        },
        signatures: ['~Super_User1']
      })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should try to change the preferred name and get an ok', function(done) {
    chai.request(server)
      .get('/profiles?id=~Melisa_Bok1')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.profiles[0].content.names.length.should.equals(2);
      response.body.profiles[0].content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.profiles[0].content.names[0].preferred.should.equals(false);
      response.body.profiles[0].content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.profiles[0].content.names[1].preferred.should.equals(true);
      var profile = response.body.profiles[0];
      profile.content.names[0].preferred = true;
      profile.content.names[1].preferred = false;
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .send(profile);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.names.length.should.equals(2);
      response.body.content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.content.names[0].preferred.should.equals(true);
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.content.names[1].preferred.should.equals(false);
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });



  it('should send expertise null and get an ok', function(done) {
    chai.request(server)
    .post('/profiles')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + superToken)
    .send({
      referent: '~Melisa_Bok1',
      content: {
       expertise: null
      },
      signatures: ['~Melisa_Bok1']
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.not.have.property('expertise');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {
         expertise: [
          {
            keywords: null,
            start: null,
            end: null
          }
         ]
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.have.property('expertise');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should add a new name using a different user and don\'t create the tilde group', function(done) {
    chai.request(server)
    .post('/profiles')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + superToken)
    .send({
      referent: '~Melisa_Bok1',
      content: {
       names: [
         {
           first: 'Another',
           last: 'Name'
         }
       ]
      },
      signatures: [user]
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.have.property('names');
      response.body.content.names.length.should.equals(3);
      response.body.content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.content.names[2].first.should.equals('Another');
      response.body.content.names[2].last.should.equals('Name');
      response.body.content.names[2].should.not.have.property('username');
      return chai.request(server)
      .get('/groups?id=' + superUser)
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.groups[0].id.should.equals(superUser);
      response.body.groups[0].members.length.should.equals(1);
      response.body.groups[0].members.should.eql(['~Super_User1']);
      return chai.request(server)
      .get('/groups?id=~Another_Name1')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(400);
      response.should.be.json;
      response.body.should.be.a('object');
      return chai.request(server)
      .get('/groups?id=melisa@gmail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.groups[0].id.should.equals('melisa@gmail.com');
      response.body.groups[0].members.length.should.equals(2);
      response.body.groups[0].members.should.eql(['~Melisa_Bok1', '~Melisa_TestBok1']);
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should confirm a new name and create the tilde group', function(done) {
    var token;
    chai.request(server)
    .post('/login')
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'melisa@gmail.com',
      password: '12345678'
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      token = response.body.token;
      return chai.request(server)
      .get('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        var profile = response.body.profiles[0];
        profile.content.names.length.should.equal(3);
        profile.content.names[0].username.should.equals('~Melisa_Bok1');
        profile.content.names[1].username.should.equals('~Melisa_TestBok1');
        profile.content.names[2].first.should.equals('Another');
        profile.content.names[2].last.should.equals('Name');
        profile.content.names[2].should.not.have.property('username');
        return chai.request(server)
        .post('/profiles')
        .set('User-Agent', 'test-create-script')
        .set('Authorization', 'Bearer ' + token)
        .send(profile);
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.have.property('names');
      response.body.content.names.length.should.equals(3);
      response.body.content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.content.names[2].should.have.property('username');
      response.body.content.names[2].username.should.equals('~Another_Name1');
      return chai.request(server)
      .get('/groups?id=~Another_Name1')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.groups[0].members.should.eql(['melisa@gmail.com']);
      return chai.request(server)
      .get('/groups?id=melisa@gmail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.groups[0].id.should.equals('melisa@gmail.com');
      response.body.groups[0].members.length.should.equals(3);
      response.body.groups[0].members.should.eql(['~Melisa_Bok1', '~Melisa_TestBok1', '~Another_Name1']);
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should allow to remove an unconfirmed new name and get an ok', function(done) {
    var token;
    chai.request(server)
    .post('/profiles')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + superToken)
    .send({
      referent: '~Melisa_Bok1',
      content: {
       names: [
         {
           first: 'Another',
           last: 'SuperName'
         }
       ]
      },
      signatures: [user]
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.have.property('names');
      response.body.content.names.length.should.equals(4);
      response.body.content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.content.names[2].username.should.equals('~Another_Name1');
      response.body.content.names[3].should.not.have.property('username');
      return chai.request(server)
        .post('/login')
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'melisa@gmail.com',
          password: '12345678'
        });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      token = response.body.token;
      return chai.request(server)
      .get('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        var profile = response.body.profiles[0];
        profile.content.names.length.should.equal(4);
        profile.content.names[0].username.should.equals('~Melisa_Bok1');
        profile.content.names[1].username.should.equals('~Melisa_TestBok1');
        profile.content.names[2].username.should.equals('~Another_Name1');
        profile.content.names[3].first.should.equal('Another');
        profile.content.names[3].last.should.equal('SuperName');
        profile.content.names[3].should.not.have.property('username');
        profile.content.names.splice(3, 1);
        profile.content.names.length.should.equal(3);
        return chai.request(server)
        .post('/profiles')
        .set('User-Agent', 'test-create-script')
        .set('Authorization', 'Bearer ' + token)
        .send(profile);
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.have.property('names');
      response.body.content.names.length.should.equals(3);
      response.body.content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      response.body.content.names[2].username.should.equals('~Another_Name1');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should remove a confirmed name using a negative inference and get an ok', function(done) {
    var token;
    chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa@gmail.com',
        password: '12345678'
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      token = response.body.token;
      return chai.request(server)
      .get('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        var profile = response.body.profiles[0];
        profile.content.names.length.should.equal(3);
        profile.content.names[0].username.should.equals('~Melisa_Bok1');
        profile.content.names[1].username.should.equals('~Melisa_TestBok1');
        profile.content.names[2].username.should.equals('~Another_Name1');
        return chai.request(server)
        .post('/profiles')
        .set('User-Agent', 'test-create-script')
        .set('Authorization', 'Bearer ' + token)
        .send({
          referent: '~Melisa_Bok1',
          content: {},
          metaContent: {
            names: {
              values: [
                {
                  first: 'Another',
                  last: 'Name',
                  preferred: false,
                  username: '~Another_Name1'
                }
              ],
              weights: [-1]
            }
          },
          signatures: ['~Melisa_Bok1']
        });
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.should.have.property('names');
      response.body.content.names.length.should.equals(2);
      response.body.content.names[0].username.should.equals('~Melisa_Bok1');
      response.body.content.names[1].username.should.equals('~Melisa_TestBok1');
      return chai.request(server)
      .get('/groups?id=~Another_Name1')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.groups[0].id.should.equals('~Another_Name1');
      response.body.groups[0].members.length.should.equals(1);
      //We need to remove this link.
      response.body.groups[0].members.should.eql(['melisa@gmail.com']);
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });


  it('should delete emails as a super user', function(done) {
    chai.request(server)
    .get('/profiles?id=~Melisa_Bok1')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + superToken)
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.profiles[0].content.should.have.property('emails');
      response.body.profiles[0].content.emails.should.eql(['melisa@gmail.com', 'another@mail.com']);
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {},
        metaContent: {
          emails: {
            values: ['melisa@gmail.com'],
            weights: [-1]
          }
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      return chai.request(server)
      .post('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .send({
        referent: '~Melisa_Bok1',
        content: {
          emails: ['melisa2@gmail.com']
        },
        signatures: ['~Melisa_Bok1']
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      return chai.request(server)
      .get('/profiles?id=~Melisa_Bok1')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.profiles[0].content.should.have.property('emails');
      response.body.profiles[0].content.emails.should.eql(['another@mail.com', 'melisa2@gmail.com']);
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });


  it('should update institution name', function(done) {
    var token;
    chai.request(server)
    .post('/login')
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'melisa@gmail.com',
      password: '12345678'
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      token = response.body.token;
      return chai.request(server)
      .get('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .then(function(response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        var profile = response.body.profiles[0];
        profile.content.history[0].institution.name = 'University of Massachusetts';
        return chai.request(server)
        .post('/profiles')
        .set('User-Agent', 'test-create-script')
        .set('Authorization', 'Bearer ' + superToken)
        .send(profile);
      });
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.content.history[0].institution.name.should.eql('University of Massachusetts');
      done();
    })
    .catch(function(error) {
      done(error);
    });
  });

});
