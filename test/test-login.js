var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);



describe('Login', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";

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

  it('should get an error when login an empty body', function(done) {
    chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .end(function(err, res) {
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

  it('should get an error when login with only username', function(done) {
    chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .send({
        id: "OpenReview.net"
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Password is missing');
        done();
      });
  });

  it('should get an error when login with nonexistent user', function(done) {
    chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .send({
        id: "nonexistent.net",
        password: "12345678"
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Invalid username or password');
        done();
      });
  });

  it('should get an error when login with nonexistent password', function(done) {
    chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .send({
        id: "test@openreview.net",
        password: "123456789"
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal('error');
        res.body.should.have.property('errors');
        res.body.errors.should.be.a('array');
        res.body.errors.length.should.equal(1);
        res.body.errors[0].should.equal('Invalid username or password');
        done();
      });
  });

  it('should login a user succesfully', function(done) {
    chai.request(server)
      .post('/login')
      .set('User-Agent', 'test-create-script')
      .send({
        id: "test@openreview.net",
        password: "12345678"
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        done();
      });
  });

});
