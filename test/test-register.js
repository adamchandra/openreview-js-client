var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');
var _ = require('lodash');

chai.use(chaiHttp);

describe('Register', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";

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

  it('email should be case insensitive', function (done) {
    let email = 'mcz@gmail.com';
    let emailMixedCase = 'mCz@gmAIl.com';
    let firstName = 'Michael';
    let lastName = 'Z';
    let user = '~' + firstName + '_' + lastName + '1';
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: emailMixedCase,
        password: '1234',
        name: {
          first: firstName,
          middle: "",
          last: lastName
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/' + _.toUpper(email))
          .send({
            content: {
              names: [
                {
                  first: firstName,
                  last: lastName,
                  username: user
                }
              ],
              preferredEmail: email,
              emails: [email]
            }
          });
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        var token = response.body.token;
        done();
      })
      .catch(function (error) {
        done(error);
      })
  });

  it('should get an error when register an empty body', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .end(function (err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Email is missing');
        done();
      });
  });

  it('should get an error when register only with the username', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa@gmail.com'
      })
      .end(function (err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Profile id or name is missing');
        done();
      });
  });

  it('should register an user if it has id and password', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa2@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
      })
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('~Melisa_Bok1');
        res.body.active.should.equal(false);
        res.body.content.preferredEmail.should.equal('melisa2@gmail.com');
        res.body.content.emails.length.should.equal(1);
        res.body.content.emails[0].should.equal('melisa2@gmail.com');
        res.body.content.names.length.should.equal(1);
        res.body.content.names[0].first.should.equal('Melisa');
        res.body.content.names[0].middle.should.equal('');
        res.body.content.names[0].last.should.equal('Bok');
        res.body.content.names[0].username.should.equal('~Melisa_Bok1');
        chai.request(server)
          .get('/groups?id=~Melisa_Bok1')
          .set('Authorization', 'Bearer ' + superToken)
          .set('User-Agent', 'test-create-script')
          .end(function (err, res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('groups');
            res.body.groups.should.be.a('array');
            res.body.groups.length.should.equal(1);
            res.body.groups[0].should.have.property('id');
            res.body.groups[0].should.have.property('members');
            res.body.groups[0].should.have.property('readers');
            res.body.groups[0].should.have.property('writers');
            res.body.groups[0].should.have.property('signatures');
            res.body.groups[0].should.have.property('signatories');
            res.body.groups[0].id.should.equal('~Melisa_Bok1');
            res.body.groups[0].members.should.be.eql(['melisa2@gmail.com']);
            res.body.groups[0].readers.should.be.eql(['~Melisa_Bok1']);
            res.body.groups[0].writers.should.be.eql(['test@openreview.net']);
            res.body.groups[0].signatories.should.be.eql(['~Melisa_Bok1']);
            res.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
            chai.request(server)
              .get('/groups?id=melisa2@gmail.com')
              .set('Authorization', 'Bearer ' + superToken)
              .set('User-Agent', 'test-create-script')
              .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('groups');
                res.body.groups.should.be.a('array');
                res.body.groups.length.should.equal(1);
                res.body.groups[0].should.have.property('id');
                res.body.groups[0].should.have.property('members');
                res.body.groups[0].should.have.property('readers');
                res.body.groups[0].should.have.property('writers');
                res.body.groups[0].should.have.property('signatures');
                res.body.groups[0].should.have.property('signatories');
                res.body.groups[0].id.should.equal('melisa2@gmail.com');
                res.body.groups[0].members.should.be.eql(['~Melisa_Bok1']);
                res.body.groups[0].readers.should.be.eql(['melisa2@gmail.com']);
                res.body.groups[0].writers.should.be.eql(['test@openreview.net']);
                res.body.groups[0].signatories.should.be.eql(['melisa2@gmail.com']);
                res.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
                done();
              });
          });
      });
  });

  it('should register an user if it has id and password and try to register again and get an error', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa3@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
      })
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('~Melisa_Bok2');
        chai.request(server)
          .post('/register')
          .set('User-Agent', 'test-create-script')
          .send({
            email: 'melisa3@gmail.com',
            password: '12345678',
            name: {
              first: "Melisa",
              middle: "",
              last: "Bok"
            }
          })
          .end(function (err, res) {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.name.should.equal('error');
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            res.body.errors.length.should.equal(1);
            res.body.errors[0].should.equal('User not confirmed. Please click on "Didn\'t receive email confirmation?" to complete the activation.');
            done();
          })
      })
  });

  it('should register an user, activate it, try to register again and get an error', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa12@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "TestFail"
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/melisa12@gmail.com')
          .send({
            content: {
              names: [
                {
                  first: 'Melisa',
                  last: 'TestFail',
                  username: '~Melisa_TestFail1'
                }
              ],
              preferredEmail: 'melisa12@gmail.com',
              emails: ['melisa12@gmail.com']
            }
          });
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        chai.request(server)
          .post('/register')
          .set('User-Agent', 'test-create-script')
          .send({
            email: 'melisa12@gmail.com',
            password: '12345678',
            name: {
              first: "Melisa",
              middle: "",
              last: "TestFail"
            }
          })
          .end(function (err, res) {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.name.should.equal('error');
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            res.body.errors.length.should.equal(1);
            res.body.errors[0].should.equal('A user with that email address already exists');
            done();
          });
      })
      .catch(function (error) {
        done(error);
      })
  });

  it('should register an user, activate it changing the email address and get an error', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa30@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "TestActivate"
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/melisa30@gmail.com')
          .send({
            content: {
              names: [
                {
                  first: 'Melisa',
                  last: 'TestFail',
                  username: '~Melisa_TestActivate1'
                }
              ],
              preferredEmail: 'melisa31@gmail.com',
              emails: ['melisa31@gmail.com']
            }
          });
      })
      .then(function (response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('status');
        response.body.should.have.property('name');
        response.body.should.have.property('message');
        response.body.status.should.equals(400);
        response.body.name.should.equals('error');
        response.body.message.should.equals('Can not delete confirmed emails: melisa30@gmail.com');
        done();
      })
      .catch(function (error) {
        done(error);
      });
  });


  it('should register an user if it has id and password and try to register with another password again and get an error', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa4@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
      })
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('~Melisa_Bok3');
        chai.request(server)
          .post('/register')
          .set('User-Agent', 'test-create-script')
          .send({
            email: 'melisa4@gmail.com',
            password: '12345678',
            name: {
              first: "Melisa",
              middle: "",
              last: "Bok"
            }
          })
          .end(function (err, res) {
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('name');
            res.body.name.should.equal('error');
            res.body.should.have.property('errors');
            res.body.errors.should.be.a('array');
            res.body.errors.length.should.equal(1);
            res.body.errors[0].should.equal('User not confirmed. Please click on "Didn\'t receive email confirmation?" to complete the activation.');
            done();
          })
      })
  });

  it('should register an user, activate it and get the username', function (done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa5@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/melisa5@gmail.com')
          .send({
            content: {
              names: [
                {
                  first: 'Melisa',
                  last: 'Bok',
                  username: '~Melisa_Bok4'
                }
              ],
              preferredEmail: 'melisa5@gmail.com',
              emails: ['melisa5@gmail.com']
            }
          });
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        var token = response.body.token;
        chai.request(server)
          .get('/groups?id=~Melisa_Bok4')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .end(function (err, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.should.have.property('groups');
            response.body.groups.should.be.a('array');
            response.body.groups.length.should.equal(1);
            response.body.groups[0].should.have.property('id');
            response.body.groups[0].should.have.property('members');
            response.body.groups[0].should.have.property('readers');
            response.body.groups[0].should.have.property('writers');
            response.body.groups[0].should.have.property('signatures');
            response.body.groups[0].should.have.property('signatories');
            response.body.groups[0].id.should.equal('~Melisa_Bok4');
            response.body.groups[0].members.should.be.eql(['melisa5@gmail.com']);
            response.body.groups[0].readers.should.be.eql(['~Melisa_Bok4']);
            response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
            response.body.groups[0].signatories.should.be.eql(['~Melisa_Bok4']);
            response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
            chai.request(server)
              .get('/groups?id=melisa5@gmail.com')
              .set('Authorization', 'Bearer ' + token)
              .set('User-Agent', 'test-create-script')
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                response.body.should.be.a('object');
                response.body.should.have.property('groups');
                response.body.groups.should.be.a('array');
                response.body.groups.length.should.equal(1);
                response.body.groups[0].should.have.property('id');
                response.body.groups[0].should.have.property('members');
                response.body.groups[0].should.have.property('readers');
                response.body.groups[0].should.have.property('writers');
                response.body.groups[0].should.have.property('signatures');
                response.body.groups[0].should.have.property('signatories');
                response.body.groups[0].id.should.equal('melisa5@gmail.com');
                response.body.groups[0].members.should.be.eql(['~Melisa_Bok4']);
                response.body.groups[0].readers.should.be.eql(['melisa5@gmail.com']);
                response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
                response.body.groups[0].signatories.should.be.eql(['melisa5@gmail.com']);
                response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
                chai.request(server)
                  .get('/profiles?id=~Melisa_Bok4')
                  .set('Authorization', 'Bearer ' + token)
                  .set('User-Agent', 'test-create-script')
                  .end(function (err, response) {
                    response.should.have.status(200);
                    response.should.be.json;
                    response.body.should.be.a('object');
                    response.body.should.have.property('profiles');
                    response.body.profiles.length.should.equal(1);
                    response.body.profiles[0].content.should.have.property('names');
                    response.body.profiles[0].content.names.should.be.a('array');
                    response.body.profiles[0].content.names.length.should.equal(1);
                    response.body.profiles[0].content.names[0].first.should.equal('Melisa');
                    response.body.profiles[0].content.names[0].last.should.equal('Bok');
                    response.body.profiles[0].content.names[0].username.should.equal('~Melisa_Bok4');
                    done();
                  });
              });
          });
      })
      .catch(function (error) {
        done(error);
      })
  });


  it('should register an user, activate it, create a username, and get the profile data', function (done) {
    var token;
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa6@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bok"
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/melisa6@gmail.com')
          .send({
            content: {
              names: [
                {
                  first: 'Melisa',
                  middle: '',
                  last: 'Bok',
                  username: '~Melisa_Bok5'
                }
              ],
              gscholar: '',
              wikipedia: '',
              linkedin: '',
              homepage: '',
              expertise: [],
              dblp: '',
              preferredEmail: 'melisa6@gmail.com',
              emails: ['melisa6@gmail.com'],
              history: [
                {
                  position: 'Developer',
                  start: 2016,
                  end: '',
                  institution: {
                    domain: 'umass.edu',
                    name: 'Umass'
                  }
                }
              ],
              relations: [
                {
                  name: "Michael Spector",
                  email: "spector@mail.com",
                  relation: "Coworker",
                  start: 2015,
                  end: null
                }
              ]
            }
          });
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        token = response.body.token;
        return chai.request(server)
          .get('/profiles')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script');
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles[0].id.should.be.equal('~Melisa_Bok5');
        response.body.profiles[0].content.should.have.property('names');
        response.body.profiles[0].content.names.should.be.a('array');
        response.body.profiles[0].content.names.length.should.equal(1);
        response.body.profiles[0].content.names[0].first.should.equal('Melisa');
        response.body.profiles[0].content.names[0].last.should.equal('Bok');
        response.body.profiles[0].content.names[0].username.should.equal('~Melisa_Bok5');
        response.body.profiles[0].content.should.have.property('emails');
        response.body.profiles[0].content.emails.should.be.a('array');
        response.body.profiles[0].content.emails[0].should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.should.have.property('preferredEmail');
        response.body.profiles[0].content.preferredEmail.should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.should.have.property('history');
        response.body.profiles[0].content.history[0].institution.name.should.equal('Umass');
        response.body.profiles[0].content.history[0].institution.domain.should.equal('umass.edu');
        response.body.profiles[0].content.history[0].position.should.equal('Developer');
        response.body.profiles[0].content.history[0].start.should.equal(2016);
        should.equal(response.body.profiles[0].content.history[0].end, null);
        response.body.profiles[0].content.should.have.property('relations');
        response.body.profiles[0].content.relations[0].name.should.equal('Michael Spector');
        response.body.profiles[0].content.relations[0].email.should.equal('spector@mail.com');
        response.body.profiles[0].content.relations[0].relation.should.equal('Coworker');
        response.body.profiles[0].content.relations[0].start.should.equal(2015);
        (response.body.profiles[0].content.relations[0].end === null).should.be.true;
        response.body.profiles[0].should.have.property('password');
        response.body.profiles[0].password.should.equal(true);
        var profile = response.body.profiles[0];
        profile.content.history.push({
          institution: {name: 'Umass', domain: 'cs.umass.edu'},
          position: 'Student',
          start: '',
          end: ''
        });
        profile.content.emails.push('melisa7@gmail.com');
        return chai.request(server)
          .post('/profiles')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .send(profile);
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.id.should.be.equal('~Melisa_Bok5');
        response.body.should.have.property('content');
        response.body.content.should.have.property('names');
        response.body.content.names.should.be.a('array');
        response.body.content.names.length.should.equal(1);
        response.body.content.names[0].first.should.equal('Melisa');
        response.body.content.names[0].last.should.equal('Bok');
        response.body.content.names[0].username.should.equal('~Melisa_Bok5');
        response.body.content.should.have.property('emails');
        response.body.content.emails.should.be.a('array');
        response.body.content.emails[0].should.equal('melisa6@gmail.com');
        response.body.content.emails[1].should.equal('melisa7@gmail.com');
        response.body.content.should.have.property('history');
        response.body.content.history[0].institution.name.should.equal('Umass');
        response.body.content.history[0].institution.domain.should.equal('cs.umass.edu');
        response.body.content.history[0].position.should.equal('Student');
        response.body.content.history[0].start.should.equal('');
        should.equal(response.body.content.history[0].end, null);
        response.body.content.history[1].institution.name.should.equal('Umass');
        response.body.content.history[1].institution.domain.should.equal('umass.edu');
        response.body.content.history[1].position.should.equal('Developer');
        response.body.content.history[1].start.should.equal(2016);
        should.equal(response.body.content.history[1].end, null);
        response.body.should.have.property('password');
        return chai.request(server)
          .get('/groups?id=~Melisa_Bok5')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script');
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('groups');
        response.body.groups.should.be.a('array');
        response.body.groups.length.should.equal(1);
        response.body.groups[0].should.have.property('id');
        response.body.groups[0].should.have.property('members');
        response.body.groups[0].should.have.property('readers');
        response.body.groups[0].should.have.property('writers');
        response.body.groups[0].should.have.property('signatures');
        response.body.groups[0].should.have.property('signatories');
        response.body.groups[0].id.should.equal('~Melisa_Bok5');
        response.body.groups[0].members.should.be.eql(['melisa6@gmail.com']);
        response.body.groups[0].readers.should.be.eql(['~Melisa_Bok5']);
        response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
        response.body.groups[0].signatories.should.be.eql(['~Melisa_Bok5']);
        response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
        return chai.request(server)
        .post('/login')
        .set('User-Agent', 'test-create-script')
        .send({
          id: "melisa6@gmail.com",
          password: "12345678"
        })
      })
      .then(function(response) {
        response.should.have.status(200);
        done();
      })
      .catch(error => done(error));
  });

  it('should create a profile, add a new name and get the username', function (done) {
    var token;
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa10@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "Bokk"
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/melisa10@gmail.com')
          .send({
            content: {
              names: [
                {
                  first: 'Melisa',
                  middle: '',
                  last: 'Bokk',
                  username: '~Melisa_Bokk1'
                }
              ],
              gscholar: '',
              wikipedia: '',
              linkedin: '',
              homepage: '',
              expertise: [],
              dblp: '',
              emails: ['melisa10@gmail.com'],
              preferredEmail: 'melisa10@gmail.com',
              history: [
                {
                  position: 'Developer',
                  start: 2016,
                  end: '',
                  institution: {
                    domain: 'umass.edu',
                    name: 'Umass'
                  }
                }
              ],
              expertise: [
                {
                  keywords: ['machine learning', 'deep learning'],
                  start: 2011,
                  end: 2015
                },
                {
                  keywords: ['nlp', 'text analysis'],
                  start: 2016,
                  end: ''
                }
              ]
            }
          });
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        token = response.body.token;
        return chai.request(server)
          .get('/profiles')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script');
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.profiles[0].id.should.be.equal('~Melisa_Bokk1');
        response.body.profiles[0].should.have.property('content');
        response.body.profiles[0].content.should.have.property('names');
        response.body.profiles[0].content.names.should.be.a('array');
        response.body.profiles[0].content.names.length.should.equal(1);
        response.body.profiles[0].content.names[0].first.should.equal('Melisa');
        response.body.profiles[0].content.names[0].last.should.equal('Bokk');
        response.body.profiles[0].content.names[0].username.should.equal('~Melisa_Bokk1');
        response.body.profiles[0].content.should.have.property('emails');
        response.body.profiles[0].content.emails.should.be.a('array');
        response.body.profiles[0].content.emails[0].should.equal('melisa10@gmail.com');
        response.body.profiles[0].content.should.have.property('history');
        response.body.profiles[0].content.history[0].institution.name.should.equal('Umass');
        response.body.profiles[0].content.history[0].institution.domain.should.equal('umass.edu');
        response.body.profiles[0].content.history[0].position.should.equal('Developer');
        response.body.profiles[0].content.history[0].start.should.equal(2016);
        should.equal(response.body.profiles[0].content.history[0].end, null);
        response.body.profiles[0].content.should.have.property('expertise');
        response.body.profiles[0].content.expertise.length.should.equal(2);
        response.body.profiles[0].content.expertise[0].keywords.should.eql(['nlp', 'text analysis']);
        response.body.profiles[0].content.expertise[0].start.should.equal(2016);
        should.equal(response.body.profiles[0].content.expertise[0].end, null);
        response.body.profiles[0].content.expertise[1].keywords.should.eql(['machine learning', 'deep learning']);
        response.body.profiles[0].content.expertise[1].start.should.equal(2011);
        response.body.profiles[0].content.expertise[1].end.should.equal(2015);
        var profile = response.body.profiles[0];
        profile.content.names.push({
          first: 'Melissa',
          last: 'Bokk'
        });
        return chai.request(server)
          .post('/profiles')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .send(profile);
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.id.should.be.equal('~Melisa_Bokk1');
        response.body.should.have.property('content');
        response.body.content.should.have.property('names');
        response.body.content.names.should.be.a('array');
        response.body.content.names.length.should.equal(2);
        response.body.content.names[0].first.should.equal('Melisa');
        response.body.content.names[0].last.should.equal('Bokk');
        response.body.content.names[0].username.should.equal('~Melisa_Bokk1');
        response.body.content.names[1].first.should.equal('Melissa');
        response.body.content.names[1].last.should.equal('Bokk');
        response.body.content.names[1].username.should.equal('~Melissa_Bokk1');
        response.body.content.should.have.property('emails');
        response.body.content.emails.should.be.a('array');
        response.body.content.emails[0].should.equal('melisa10@gmail.com');
        response.body.content.should.have.property('history');
        response.body.content.history[0].institution.name.should.equal('Umass');
        response.body.content.history[0].institution.domain.should.equal('umass.edu');
        response.body.content.history[0].position.should.equal('Developer');
        response.body.content.history[0].start.should.equal(2016);
        should.equal(response.body.content.history[0].end, null);
        chai.request(server)
          .get('/groups?id=~Melissa_Bokk1')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .end(function (err, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.should.have.property('groups');
            response.body.groups.should.be.a('array');
            response.body.groups.length.should.equal(1);
            response.body.groups[0].should.have.property('id');
            response.body.groups[0].should.have.property('members');
            response.body.groups[0].should.have.property('readers');
            response.body.groups[0].should.have.property('writers');
            response.body.groups[0].should.have.property('signatures');
            response.body.groups[0].should.have.property('signatories');
            response.body.groups[0].id.should.equal('~Melissa_Bokk1');
            response.body.groups[0].members.should.be.eql(['melisa10@gmail.com']);
            response.body.groups[0].readers.should.be.eql(['~Melissa_Bokk1']);
            response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
            response.body.groups[0].signatories.should.be.eql(['~Melissa_Bokk1']);
            response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
            chai.request(server)
              .get('/groups?id=melisa10@gmail.com')
              .set('Authorization', 'Bearer ' + token)
              .set('User-Agent', 'test-create-script')
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                response.body.should.be.a('object');
                response.body.should.have.property('groups');
                response.body.groups.should.be.a('array');
                response.body.groups.length.should.equal(1);
                response.body.groups[0].should.have.property('id');
                response.body.groups[0].should.have.property('members');
                response.body.groups[0].should.have.property('readers');
                response.body.groups[0].should.have.property('writers');
                response.body.groups[0].should.have.property('signatures');
                response.body.groups[0].should.have.property('signatories');
                response.body.groups[0].id.should.equal('melisa10@gmail.com');
                response.body.groups[0].members[0].should.equal('~Melisa_Bokk1');
                response.body.groups[0].members[1].should.equal('~Melissa_Bokk1');
                response.body.groups[0].readers.should.be.eql(['melisa10@gmail.com']);
                response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
                response.body.groups[0].signatories.should.be.eql(['melisa10@gmail.com']);
                response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
                done();
              });
          });
      })
      .catch(error => done(error));
  });

  it('should create a profile, add a two new usernames and get the user members in order', function (done) {
    var token;
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa11@gmail.com',
        password: '12345678',
        name: {
          first: "Melisa",
          middle: "",
          last: "TestOne"
        }
      })
      .then(function (response) {
        utils.assertIdResponse(response);
        return chai.request(server)
          .put('/activate/melisa11@gmail.com')
          .send({
            content: {
              names: [
                {
                  first: 'Melisa',
                  middle: '',
                  last: 'TestOne',
                  username: '~Melisa_TestOne1'
                }
              ],
              gscholar: '',
              wikipedia: '',
              linkedin: '',
              homepage: '',
              expertise: [],
              dblp: '',
              emails: ['melisa11@gmail.com'],
              preferredEmail: 'melisa11@gmail.com',
              history: [
                {
                  position: 'Developer',
                  start: 2016,
                  end: '',
                  institution: {
                    domain: 'umass.edu',
                    name: 'Umass'
                  }
                }
              ],
              expertise: [
                {
                  keywords: ['machine learning', 'deep learning'],
                  start: 2011,
                  end: 2015
                },
                {
                  keywords: ['nlp', 'text analysis'],
                  start: 2016,
                  end: ''
                }
              ]
            }
          });
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        token = response.body.token;
        return chai.request(server)
          .get('/profiles')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script');
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.profiles[0].id.should.be.equal('~Melisa_TestOne1');
        response.body.profiles[0].should.have.property('content');
        response.body.profiles[0].content.should.have.property('names');
        response.body.profiles[0].content.names.should.be.a('array');
        response.body.profiles[0].content.names.length.should.equal(1);
        response.body.profiles[0].content.names[0].first.should.equal('Melisa');
        response.body.profiles[0].content.names[0].last.should.equal('TestOne');
        response.body.profiles[0].content.names[0].username.should.equal('~Melisa_TestOne1');
        response.body.profiles[0].content.should.have.property('emails');
        response.body.profiles[0].content.emails.should.be.a('array');
        response.body.profiles[0].content.emails[0].should.equal('melisa11@gmail.com');
        response.body.profiles[0].content.should.have.property('history');
        response.body.profiles[0].content.history[0].institution.name.should.equal('Umass');
        response.body.profiles[0].content.history[0].institution.domain.should.equal('umass.edu');
        response.body.profiles[0].content.history[0].position.should.equal('Developer');
        response.body.profiles[0].content.history[0].start.should.equal(2016);
        should.equal(response.body.profiles[0].content.history[0].end, null);
        response.body.profiles[0].content.should.have.property('expertise');
        response.body.profiles[0].content.expertise.length.should.equal(2);
        response.body.profiles[0].content.expertise[0].keywords.should.eql(['nlp', 'text analysis']);
        response.body.profiles[0].content.expertise[0].start.should.equal(2016);
        should.equal(response.body.profiles[0].content.expertise[0].end, null);
        response.body.profiles[0].content.expertise[1].keywords.should.eql(['machine learning', 'deep learning']);
        response.body.profiles[0].content.expertise[1].start.should.equal(2011);
        response.body.profiles[0].content.expertise[1].end.should.equal(2015);
        var profile = response.body.profiles[0];
        profile.content.names = [
          {
            first: 'Melisa',
            middle: '',
            last: 'TestOne',
            username: '~Melisa_TestOne1'
          },
          {
            first: 'Melisa',
            middle: '',
            last: 'TestTwo',
            username: ''
          },
          {
            first: 'Melisa',
            middle: '',
            last: 'TestThree',
            username: ''
          }
        ];
        return chai.request(server)
          .post('/profiles')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .send(profile);
      })
      .then(function (response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.id.should.be.equal('~Melisa_TestOne1');
        response.body.should.have.property('content');
        response.body.content.should.have.property('names');
        response.body.content.names.should.be.a('array');
        response.body.content.names.length.should.equal(3);
        response.body.content.names[0].first.should.equal('Melisa');
        response.body.content.names[0].last.should.equal('TestOne');
        response.body.content.names[0].username.should.equal('~Melisa_TestOne1');
        response.body.content.names[1].first.should.equal('Melisa');
        response.body.content.names[1].last.should.equal('TestTwo');
        response.body.content.names[1].username.should.equal('~Melisa_TestTwo1');
        response.body.content.names[2].first.should.equal('Melisa');
        response.body.content.names[2].last.should.equal('TestThree');
        response.body.content.names[2].username.should.equal('~Melisa_TestThree1');
        response.body.content.should.have.property('emails');
        response.body.content.emails.should.be.a('array');
        response.body.content.emails[0].should.equal('melisa11@gmail.com');
        response.body.content.should.have.property('history');
        response.body.content.history[0].institution.name.should.equal('Umass');
        response.body.content.history[0].institution.domain.should.equal('umass.edu');
        response.body.content.history[0].position.should.equal('Developer');
        response.body.content.history[0].start.should.equal(2016);
        should.equal(response.body.content.history[0].end, null);
        chai.request(server)
          .get('/groups?id=~Melisa_TestOne1')
          .set('Authorization', 'Bearer ' + token)
          .set('User-Agent', 'test-create-script')
          .end(function (err, response) {
            response.should.have.status(200);
            response.should.be.json;
            response.body.should.be.a('object');
            response.body.should.have.property('groups');
            response.body.groups.should.be.a('array');
            response.body.groups.length.should.equal(1);
            response.body.groups[0].should.have.property('id');
            response.body.groups[0].should.have.property('members');
            response.body.groups[0].should.have.property('readers');
            response.body.groups[0].should.have.property('writers');
            response.body.groups[0].should.have.property('signatures');
            response.body.groups[0].should.have.property('signatories');
            response.body.groups[0].id.should.equal('~Melisa_TestOne1');
            response.body.groups[0].members.should.be.eql(['melisa11@gmail.com']);
            response.body.groups[0].readers.should.be.eql(['~Melisa_TestOne1']);
            response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
            response.body.groups[0].signatories.should.be.eql(['~Melisa_TestOne1']);
            response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
            chai.request(server)
              .get('/groups?id=melisa11@gmail.com')
              .set('Authorization', 'Bearer ' + token)
              .set('User-Agent', 'test-create-script')
              .end(function (err, response) {
                response.should.have.status(200);
                response.should.be.json;
                response.body.should.be.a('object');
                response.body.should.have.property('groups');
                response.body.groups.should.be.a('array');
                response.body.groups.length.should.equal(1);
                response.body.groups[0].should.have.property('id');
                response.body.groups[0].should.have.property('members');
                response.body.groups[0].should.have.property('readers');
                response.body.groups[0].should.have.property('writers');
                response.body.groups[0].should.have.property('signatures');
                response.body.groups[0].should.have.property('signatories');
                response.body.groups[0].id.should.equal('melisa11@gmail.com');
                response.body.groups[0].members[0].should.equal('~Melisa_TestOne1');
                response.body.groups[0].members[1].should.equal('~Melisa_TestTwo1');
                response.body.groups[0].members[2].should.equal('~Melisa_TestThree1');
                response.body.groups[0].readers.should.be.eql(['melisa11@gmail.com']);
                response.body.groups[0].writers.should.be.eql(['test@openreview.net']);
                response.body.groups[0].signatories.should.be.eql(['melisa11@gmail.com']);
                response.body.groups[0].signatures.should.be.eql(['test@openreview.net']);
                done();
              });
          });
      })
      .catch(error => done(error));
  });

  it('should get all the profiles given a list of ids', function (done) {
    chai.request(server)
    .post('/profiles/search')
    .set('Authorization', 'Bearer ' + testToken)
    .set('User-Agent', 'test-create-script')
    .send({
      ids: ['~Melisa_Bok1', '~Melisa_Bok2']
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.length.should.equal(2);
      response.body.profiles[0].id.should.equal('~Melisa_Bok1');
      response.body.profiles[1].id.should.equal('~Melisa_Bok2');
      response.body.profiles[0].content.emails[0].should.equal('m****2@gmail.com');
      response.body.profiles[0].content.preferredEmail.should.equal('m****2@gmail.com');
      response.body.profiles[0].content.emailsConfirmed[0].should.equal('m****2@gmail.com');
      response.body.profiles[0].should.have.property('password');
      response.body.profiles[0].password.should.equal(true);
      response.body.profiles[1].content.emails[0].should.equal('m****3@gmail.com');
      response.body.profiles[1].content.emailsConfirmed[0].should.equal('m****3@gmail.com');
      response.body.profiles[1].should.have.property('password');
      response.body.profiles[1].password.should.equal(true);
      return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'Program_Chairs',
        readers: ['everyone'],
        writers: ['Program_Chairs'],
        signatories: ['~Super_User1'],
        signatures: ['~Super_User1'],
        members: ['~Test_User1']
      })
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      return chai.request(server)
      .post('/profiles/search')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send({
        ids: ['~Melisa_Bok1', '~Melisa_Bok2']
      });
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.length.should.equal(2);
      response.body.profiles[0].id.should.equal('~Melisa_Bok1');
      response.body.profiles[1].id.should.equal('~Melisa_Bok2');
      response.body.profiles[0].content.emails[0].should.equal('melisa2@gmail.com');
      response.body.profiles[0].content.preferredEmail.should.equal('melisa2@gmail.com');
      response.body.profiles[0].content.emailsConfirmed[0].should.equal('melisa2@gmail.com');
      response.body.profiles[0].should.have.property('password');
      response.body.profiles[0].password.should.equal(true);
      response.body.profiles[1].content.emails[0].should.equal('melisa3@gmail.com');
      response.body.profiles[1].content.emailsConfirmed[0].should.equal('melisa3@gmail.com');
      response.body.profiles[1].should.have.property('password');
      response.body.profiles[1].password.should.equal(true);
      done();
    })
    .catch(function(error) {
      done(error);
    })

  });

  it('should get all the profiles given a list of ids as superUser', function (done) {
    chai.request(server)
      .post('/profiles/search')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        ids: ['~Melisa_Bok1', '~Melisa_Bok2']
      })
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(2);
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        response.body.profiles[1].id.should.equal('~Melisa_Bok2');
        response.body.profiles[0].content.emails[0].should.equal('melisa2@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('melisa2@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('melisa2@gmail.com');
        response.body.profiles[1].content.emails[0].should.equal('melisa3@gmail.com');
        response.body.profiles[1].content.emailsConfirmed[0].should.equal('melisa3@gmail.com');
        done();
      });

  });


  it('should get all the profiles given a list of emails', function (done) {
    chai.request(server)
      .post('/profiles/search')
      .set('User-Agent', 'test-create-script')
      .send({
        emails: ['melisa2@gmail.com', 'melisa3@gmail.com']
      })
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(2);
        response.body.profiles[0].email.should.equal('melisa2@gmail.com');
        response.body.profiles[1].email.should.equal('melisa3@gmail.com');
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        response.body.profiles[1].id.should.equal('~Melisa_Bok2');
        response.body.profiles[0].content.emails[0].should.equal('m****2@gmail.com');
        response.body.profiles[1].content.emails[0].should.equal('m****3@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('m****2@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('m****2@gmail.com');
        response.body.profiles[1].content.preferredEmail.should.equal('m****3@gmail.com');
        response.body.profiles[1].content.emailsConfirmed[0].should.equal('m****3@gmail.com');
        response.body.profiles[0].password.should.equal(true);
        response.body.profiles[1].password.should.equal(true);
        done();
      });

  });

  it('should get all the profiles given a list of emails as superUser', function (done) {
    chai.request(server)
      .post('/profiles/search')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        emails: ['melisa2@gmail.com', 'melisa3@gmail.com']
      })
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(2);
        response.body.profiles[0].email.should.equal('melisa2@gmail.com');
        response.body.profiles[1].email.should.equal('melisa3@gmail.com');
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        response.body.profiles[1].id.should.equal('~Melisa_Bok2');
        response.body.profiles[0].content.emails[0].should.equal('melisa2@gmail.com');
        response.body.profiles[1].content.emails[0].should.equal('melisa3@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('melisa2@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('melisa2@gmail.com');
        response.body.profiles[1].content.preferredEmail.should.equal('melisa3@gmail.com');
        response.body.profiles[1].content.emailsConfirmed[0].should.equal('melisa3@gmail.com');
        response.body.profiles[0].password.should.equal(true);
        response.body.profiles[1].password.should.equal(true);
        done();
      });

  });


  it('should search profiles by a term and get a non empty result', function (done) {
    chai.request(server)
      .get('/profiles/search?term=melisa bok')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(6);
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        response.body.profiles[1].id.should.equal('~Melisa_Bok2');
        response.body.profiles[2].id.should.equal('~Melisa_Bok3');
        response.body.profiles[3].id.should.equal('~Melisa_Bok4');
        response.body.profiles[4].id.should.equal('~Melisa_Bok5');
        response.body.profiles[5].id.should.equal('~Melisa_Bokk1');
        done();
      });

  });

  it('should search profiles by a prefix term and get a non empty result', function (done) {
    chai.request(server)
      .get('/profiles/search?term=melisa2@')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        done();
      });

  });



  it('should get all the profiles given a group id', function (done) {
    chai.request(server)
      .get('/profiles?group=melisa2@gmail.com')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        response.body.profiles[0].id.should.equal('~Melisa_Bok1');
        done();
      });

  });

  it('should get the logged profile', function (done) {
    chai.request(server)
      .get('/profiles')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        response.body.profiles[0].id.should.equals('~Test_User1');
        done();
      });

  });

  it('should get an error when not logged user', function (done) {
    chai.request(server)
      .get('/profiles')
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('missing required parameter');
        done();
      });

  });

  it('should get a public profile with all the emails hidden', function (done) {
    chai.request(server)
      .get('/profiles?id=~Melisa_Bok5')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        response.body.profiles[0].id.should.equal('~Melisa_Bok5');
        response.body.profiles[0].content.emails[0].should.equal('m****6@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('m****6@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('m****6@gmail.com');
        response.body.profiles[0].content.relations[0].email.should.equal('s****r@mail.com');
        done();
      });

  });

  it('should get a public profile by email with all the emails hidden', function (done) {
    chai.request(server)
      .get('/profiles?email=melisa6@gmail.com')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        response.body.profiles[0].id.should.equal('~Melisa_Bok5');
        response.body.profiles[0].content.emails[0].should.equal('m****6@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('m****6@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('m****6@gmail.com');
        response.body.profiles[0].content.relations[0].email.should.equal('s****r@mail.com');
        done();
      });

  });

  it('should get a public profile as superUser with all the emails visible', function (done) {
    chai.request(server)
      .get('/profiles?id=~Melisa_Bok5')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles[0].id.should.equal('~Melisa_Bok5');
        response.body.profiles[0].content.emails[0].should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.relations[0].email.should.equal('spector@mail.com');
        done();
      });

  });


  it('should get a public profile as superUser with all the emails visible', function (done) {
    chai.request(server)
      .get('/profiles?email=melisa6@gmail.com')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function (err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles[0].id.should.equal('~Melisa_Bok5');
        response.body.profiles[0].content.emails[0].should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.preferredEmail.should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.emailsConfirmed[0].should.equal('melisa6@gmail.com');
        response.body.profiles[0].content.relations[0].email.should.equal('spector@mail.com');
        done();
      });

  });

});
