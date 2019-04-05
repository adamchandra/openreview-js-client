var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);

describe('Users', function() {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "test@test.com";
  var token = '';

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

  it('should create a new user, its only institution and add the user as a member of them', function(done) {
    utils.createAndLoginUser('mbok@mail.com', 'Melisa', 'Mail')
    .then(function(newToken) {
      token = newToken;
      return chai.request(server)
              .get('/groups?member=mbok@mail.com')
              .set('Authorization', 'Bearer ' + superToken)
              .set('User-Agent', 'test-create-script');

    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('groups');
      response.body.groups.should.be.a('array');
      response.body.groups.length.should.equal(6);
      response.body.groups[0].id.should.equal('(anonymous)');
      response.body.groups[1].id.should.equal('everyone');
      response.body.groups[2].id.should.equal('~');
      response.body.groups[3].id.should.equal('~Melisa_Mail1');
      response.body.groups[4].id.should.equal('mbok@mail.com');
      response.body.groups[5].id.should.equal('mail.com');
      return utils.createAndLoginUser('mspector@mail.com', 'Michael', 'Mail');
    })
    .then(function(response) {
      return chai.request(server)
              .get('/groups?member=mspector@mail.com')
              .set('Authorization', 'Bearer ' + superToken)
              .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('groups');
      response.body.groups.should.be.a('array');
      response.body.groups.length.should.equal(6);
      response.body.groups[0].id.should.equal('(anonymous)');
      response.body.groups[1].id.should.equal('everyone');
      response.body.groups[2].id.should.equal('~');
      response.body.groups[3].id.should.equal('~Michael_Mail1');
      response.body.groups[4].id.should.equal('mspector@mail.com');
      response.body.groups[5].id.should.equal('mail.com');
      done();
    })
    .catch(function(error) {
      done(error);
    })

  });

   it('should create a new user, and search the profile by first, last name', function(done) {
    utils.createAndLoginUser('mbok2@mail.com', 'Melissa', 'Mail')
    .then(function(response) {
      return chai.request(server)
              .get('/profiles?first=Melissa&last=Mail')
              .set('Authorization', 'Bearer ' + superToken)
              .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~Melissa_Mail1');
      done();
    })
    .catch(function(error) {
      done(error);
    })

  });

   it('should search the profile by no existent first, last name and get an empty result', function(done) {
    chai.request(server)
      .get('/profiles?first=Melia&last=Mail')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(0);
      done();
    })
    .catch(function(error) {
      done(error);
    })

  });

   it('should search the profile by only first name and get an error', function(done) {
    chai.request(server)
      .get('/user/profile?first=Melisa')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors[0].should.equal('First and last name are required');
        done();
      });

  });

  it('should search the profile by only first name and get an ok', function(done) {
    chai.request(server)
      .get('/profiles?first=Melisa')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        response.body.profiles[0].id.should.equal('~Melisa_Mail1');
        done();
      });

  });

  it('should search the profile by email and get an ok', function(done) {
    chai.request(server)
      .get('/profiles?email=' + user)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        done();
      });

  });

  it('should search the profile by non existent email and get an error', function(done) {
    chai.request(server)
      .get('/user/profile?email=mail@test.com')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Profile not found');
        done();
      });

  });

  it('should search the profile by non existent email and get an ok', function(done) {
    chai.request(server)
      .get('/profiles?email=mail@test.com')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(0);
        done();
      });

  });

  it('should search the profile by id and get an ok', function(done) {
    chai.request(server)
      .get('/profiles?id=~Test_User1')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        done();
      });

  });

  it('should search the profile by non existent id and get an error', function(done) {
    chai.request(server)
      .get('/user/profile?id=~Test_User2')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Profile not found');
        done();
      });

  });

  it('should search the profile by non existent id and get an ok', function(done) {
    chai.request(server)
      .get('/profiles?id=~Test_User2')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(0);
        done();
      });

  });

  it('should call the profiles endpoint with no parameters and get the logged in users profile', function(done) {
    chai.request(server)
      .get('/profiles')
      .set('Authorization', 'Bearer ' + token)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('profiles');
        response.body.profiles.length.should.equal(1);
        done();
      });

  });

  it('should get profile options and get an ok', function(done) {
    chai.request(server)
      .get('/profiles/options')
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('prefixedPositions');
        response.body.prefixedPositions.should.be.a('array');
        response.body.should.have.property('prefixedRelations');
        response.body.prefixedRelations.should.be.a('array');
        response.body.should.have.property('institutions');
        response.body.institutions.should.be.a('array');
        done();
      });

  });

  it('should impersonate without a super user token and get an error', function(done) {
    chai.request(server)
      .get('/impersonate?groupId=test@openreview.net')
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Not logged in as super user');
        done();
      });

  });

  it('should impersonate an invalid group id with a super user token and get an error', function(done) {
    chai.request(server)
      .get('/impersonate?groupId=test@ff.net')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Group Not Found: test@ff.net');
        done();
      });

  });

  it('should impersonate an valid group id with a super user and get an ok', function(done) {
    chai.request(server)
      .get('/impersonate?groupId=' + user)
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        response.body.should.have.property('user');
        chai.request(server)
        .get('/profiles')
        .set('Authorization', 'Bearer ' + response.body.token)
        .set('User-Agent', 'test-create-script')
        .end(function(err, response) {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('object');
          response.body.should.have.property('profiles');
          response.body.profiles[0].id.should.equal('~Test_User1');
          done();
        });
      });

  });

  it('should forgot password and get a new link', function(done) {
    chai.request(server)
      .post('/resettable')
      .set('User-Agent', 'test-create-script')
      .send({
        id: user
      })
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        done();
      });
  });


  it('should forgot password of UPPER CASE email and get a new link', function(done) {
    chai.request(server)
      .post('/resettable')
      .set('User-Agent', 'test-create-script')
      .send({
        id: user.toUpperCase()
      })
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        done();
      });
  });

  it('should forgot password of unknown email and get an error', function(done) {
    chai.request(server)
      .post('/resettable')
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'pdddd@mail.com'
      })
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('User not found');
        done();
      });
  });

  it('should impersonate with regular user and get an error', function(done) {
    chai.request(server)
      .get('/impersonate?groupId=mbok@mail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Not logged in as super user');
        done();
      });
  });

  it('should impersonate with no parameter and get an error', function(done) {
    chai.request(server)
      .get('/impersonate')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('groupId is missing');
        done();
      });
  });


  it('should impersonate with non existent groupId and get an error', function(done) {
    chai.request(server)
      .get('/impersonate?groupId=ttt@mail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(err, response) {
        response.should.have.status(400);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('name');
        response.body.name.should.equal('error');
        response.body.should.have.property('errors');
        response.body.errors.should.be.a('array');
        response.body.errors.length.should.equal(1);
        response.body.errors[0].should.equal('Group Not Found: ttt@mail.com');
        done();
      });
  });

  it('should impersonate with super user and get an ok', function(done) {
    chai.request(server)
      .get('/impersonate?groupId=mbok@mail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken)
      .end(function(err, response) {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('object');
        response.body.should.have.property('token');
        response.body.should.have.property('user');
        done();
      });
  });

  it('should confirm an alternate email and the email group should be created and added to the profile', function(done) {

    chai.request(server)
    .post('/login')
    .set('User-Agent', 'test-create-script')
    .send({
      id: 'mbok@mail.com',
      password: '12345678'
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.user.id.should.equal('mbok@mail.com');
      res.body.user.profile.id.should.equal('~Melisa_Mail1');
      res.body.user.profile.emails.should.eql(['mbok@mail.com']);
      token = res.body.token;
      return chai.request(server)
      .get('/profiles')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token);
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.profiles[0].id.should.equal('~Melisa_Mail1');
      res.body.profiles[0].content.emails.should.eql(['mbok@mail.com']);
      res.body.profiles[0].content.emailsConfirmed.should.eql(['mbok@mail.com']);
      return chai.request(server)
      .post('/user/confirm')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .send({
        alternate: 'another@mail.com',
        username: '~Melisa_Mail1'
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
        .put('/activatelink/another@mail.com')
        .set('User-Agent', 'test-create-script')
        .set('Authorization', 'Bearer ' + token);
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .get('/profiles')
      .set('Authorization', 'Bearer ' + token)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('profiles');
      res.body.profiles[0].id.should.equal('~Melisa_Mail1');
      res.body.profiles[0].content.emails.should.eql(['mbok@mail.com', 'another@mail.com']);
      res.body.profiles[0].content.emailsConfirmed.should.eql(['mbok@mail.com', 'another@mail.com']);
      return chai.request(server)
      .get('/profiles?id=~Melisa_Mail1')
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('profiles');
      res.body.profiles[0].id.should.equal('~Melisa_Mail1');
      res.body.profiles[0].content.emails.should.eql(['m****k@mail.com', 'a****r@mail.com']);
      res.body.profiles[0].content.emailsConfirmed.should.eql(['m****k@mail.com', 'a****r@mail.com']);
      return chai.request(server)
      .get('/references?referent=~Melisa_Mail1')
      .set('Authorization', 'Bearer ' + token)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('references');
      res.body.references.length.should.equal(2);
      res.body.references[0].content.should.eql({ emails: ['another@mail.com']});
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });


  it('should confirm an alternate email that is being confirmed in another profile and get an error', function(done) {

    chai.request(server)
    .post('/user/confirm')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + testToken)
    .send({
      alternate: 'another@mail.com',
      username: '~Test_User1'
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].should.equal('The email is already confirmed in the profile ~Melisa_Mail1');
      return chai.request(server)
      .post('/user/confirm')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        alternate: 'another@mail.com',
        username: '~Melisa_Mail1'
      });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].should.equal('Operation not permitted');
      return chai.request(server)
      .post('/user/confirm')
      .set('User-Agent', 'test-create-script')
      .send({
        alternate: 'another@mail.com',
        username: '~Melisa_Mail1'
      });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].should.equal('Operation not permitted');
      return chai.request(server)
      .post('/user/confirm')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + token)
      .send({
        alternate: 'another@mail.com',
        username: '~Melisa_Mail1'
      });
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].should.equal('Email already confirmed');
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

});
