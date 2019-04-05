'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var utils = require('./testUtils');

chai.should();
chai.use(chaiHttp);

describe('TildeUsername', function () {

  var server = utils.server;
  var superToken = "";
  var superUser = "test@openreview.net";
  var testToken = "";
  var user = "user@test.com";

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


  it('validate TildeUsername with English characters and get an ok', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Melisa&last=Bok&middle=')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.username.should.equal('~Melisa_Bok1');
      done();
    });

  });

  it('validate TildeUsername with numbers and get an error', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Melisa2&last=Bok&middle=')
    .end(function (err, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('error');
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
      res.body.errors.length.should.equal(1);
      res.body.errors[0].should.equal('Name is not allowed to contain digits');
      done();
    });

  });

  it('validate TildeUsername with spaces and get an ok without spaces', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Melisa  &last=Bok&middle=')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~Melisa_Bok1');
      done();
    });

  });

  it('validate TildeUsername with Greek characters and get an ok', function (done) {

    chai.request(server)
    .get('/tildeusername?first=%D0%92%D1%83%D1%82%D1%88%D1%8B&last=&middle=')
    .end(function (err, res) {
      res.should.have.status(200);
      done();
    });

  });

  it('validate TildeUsername with aphostrophe characters and get an ok', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Alberto&last=Lascorz&middle=Delm%27as')
    .end(function (err, res) {
      res.should.have.status(200);
      done();
    });

  });

  it('validate TildeUsername with chinese characters and get an ok', function (done) {

    chai.request(server)
    .get(encodeURI('/tildeusername?first=汉字&last=&middle='))
    .end(function (err, res) {
      res.should.have.status(200);
      done();
    });

  });

  it('validate TildeUsername with an existent first name and get an ok', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Test&middle=&last=')
    .end(function (err, res) {
      res.should.have.status(200);
      res.body.username.should.equal('~Test_1');
      done();
    });

  });

  it('validate TildeUsername with spaces within first/middle/last name and get an ok spaces replaced with underscore', function (done) {

    chai.request(server)
    .get('/tildeusername?first=first%20name&middle=middle name&last=last%20name')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~first_name_middle_name_last_name1');
      done();
    });

  });

  it('should create a new user.', function (done) {
    utils.createAndLoginUser('mz@test.com', 'Michael', 'Z')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=Michael&last=Z')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~Michael_Z1');
      response.body.profiles[0].content.emails[0].should.equal('mz@test.com');
      return chai.request(server)
      .get('/profiles?first=Michael&last=Z')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~Michael_Z1');
      response.body.profiles[0].content.emails[0].should.equal('m****z@test.com');
      done();
    })
    .catch(function (error) {
      done(error);
    });

  });



  it('Get second tilde name.', function (done) {
    chai.request(server)
    .get('/tildeusername?first=Michael&last=Z')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~Michael_Z2');
      done();
    });

  });

  it('Get second tilde name - case insensitive.', function (done) {
    chai.request(server)
    .get('/tildeusername?first=micHael&last=z')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~micHael_z2');
      done();
    });

  });


  it('validate TildeUsername with hyphen within first name and get an ok', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Hy-Phen&middle=&last=Lastname')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~Hy-Phen_Lastname1');
      done();
    });

  });


  it('should create a new user with hyphen in name.', function (done) {
    utils.createAndLoginUser('hyphen@test.com', 'Hy-Phen', 'Lastname')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=Hy-Phen&last=Lastname')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~Hy-Phen_Lastname1');
      done();
    })
    .catch(function (error) {
      done(error);
    });

  });

  it('should create a new user with multiple hyphens in name.', function (done) {
    utils.createAndLoginUser('multihyphen@test.com', 'Hy-Phen', 'Last-name')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=Hy-Phen&last=Last-name')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~Hy-Phen_Last-name1');
      done();
    })
    .catch(function (error) {
      done(error);
    });

  });

  it('Get second tilde name for name with hyphen.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Hy-Phen&middle=&last=Lastname')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~Hy-Phen_Lastname2');
      done();
    });

  });

  it('Get tilde name (first one) for same name without hyphen.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=Hy%20Phen&middle=&last=Lastname')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~Hy_Phen_Lastname1');
      done();
    });

  });

  it('Get tilde name for name with a period, no spaces.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=W.Bruce&middle=&last=Croft')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~W.Bruce_Croft1');
      done();
    });

  });

  it('Get tilde name for name with a period and space.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=W.%20Bruce&last=Croft')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~W._Bruce_Croft1');
      done();
    });

  });


  it('should create a new user with period and space in name.', function (done) {

    utils.createAndLoginUser('bruce@test.com', 'W. Bruce', 'Croft')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=W.%20Bruce&last=Croft')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~W._Bruce_Croft1');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('Get second tilde name for existing name with a period and space.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=W.%20Bruce&last=Croft')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~W._Bruce_Croft2');
      done();
    });

  });

  it('Get new tilde name for existing name without a period and space.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=W%20Bruce&last=Croft')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~W_Bruce_Croft1');
      done();
    });

  });

  it('should create a new user with period and two spaces in name.', function (done) {

    utils.createAndLoginUser('brucetwo@test.com', 'W. Bruce', 'Croft Last')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=W.%20Bruce&last=Croft%20Last')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~W._Bruce_Croft_Last1');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should create a new user with a middle name.', function (done) {

    utils.createAndLoginUserFullName('mcz@test.com', 'Michael', 'C', 'Z')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=Michael&middle=C&last=Z')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~Michael_C_Z1');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('should get two profiles for Michael Z, no middle name specified.', function (done) {

    chai.request(server)
    .get('/profiles?first=Michael&last=Z')
    .end(function (err, response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(2);
      // make sure they are different
      response.body.profiles[0].id.should.not.equal(response.body.profiles[1].id);
      // can't be sure of the order they are returned so we do this ugly check...
      var checkFirst = response.body.profiles[0].id === '~Michael_Z1' || response.body.profiles[0].id === '~Michael_C_Z1';
      var checkSecond = response.body.profiles[1].id === '~Michael_Z1' || response.body.profiles[1].id === '~Michael_C_Z1';
      checkFirst.should.equal(true);
      checkSecond.should.equal(true);
      done();
    });
  });

  it('Get new tilde name for new name.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=W.E.B.&middle=Du&last=Bois')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~W.E.B._Du_Bois1');
      done();
    });

  });


  it('should create a new user with a middle name.', function (done) {

    utils.createAndLoginUserFullName('web@test.com', 'W.E.B.', 'Du', 'Bois')
    .then(function (response) {
      return chai.request(server)
      .get('/profiles?first=W.E.B.&middle=Du&last=Bois')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function (response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('profiles');
      response.body.profiles.should.be.a('array');
      response.body.profiles.length.should.equal(1);
      response.body.profiles[0].id.should.equal('~W.E.B._Du_Bois1');
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('Get second tilde name for existing name.', function (done) {

    chai.request(server)
    .get('/tildeusername?first=W.E.B.&middle=Du&last=Bois')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal('~W.E.B._Du_Bois2');
      done();
    });

  });

  var profileData = {};
  it('Get profile data for michael z.', function (done) {
    chai.request(server)
    .get('/profiles?id=~Michael_Z1')
    .set('Authorization', 'Bearer ' + superToken)
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.profiles[0].id.should.equal('~Michael_Z1');
      profileData = res.body.profiles[0];
      done();
    });
  });


  it('should update profile adding an alternate tilde name for existing user', function (done) {

    profileData.content.names = [
      {
        first: 'Michael',
        middle: '',
        last: 'Z',
        username: '~Michael_Z1'
      },
      {
        first: 'my',
        middle: 'secret',
        last: 'identity',
        username: '~my_secret_identity1'
      }
    ];

    chai.request(server)
    .post('/profiles')
    .set('Authorization', 'Bearer ' + superToken)
    .set('User-Agent', 'test-create-script')
    .send(profileData)
    .then(function (res) {
      res.should.have.status(200);
      done();
    })
    .catch(function (error) {
      done(error);
    });
  });

  it('Get profile data using first tilde name', function (done) {
    chai.request(server)
    .get('/profiles?id=~Michael_Z1')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.profiles[0].id.should.equal('~Michael_Z1');
      done();
    });
  });

  it('Get profile data using alternate tilde name', function (done) {
    chai.request(server)
    .get('/profiles?id=~my_secret_identity1')
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.profiles[0].id.should.equal('~Michael_Z1');
      done();
    });
  });


});
