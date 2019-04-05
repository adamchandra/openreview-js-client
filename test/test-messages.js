var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);



describe('Messages', function() {

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

  it('should send an email to recipient email address that is not in the system and get an ok', function(done) {
    chai.request(server)
      .post('/messages')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['melisa@mail.com']
      })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.should.eql(['melisa@mail.com']);
      return chai.request(server)
      .get('/messages?to=melisa@mail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + superToken);
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('messages');
      res.body.messages.length.should.equal(1);
      res.body.messages[0].content.subject.should.equal('Subject');
      return chai.request(server)
      .get('/messages?to=melisa@mail.com')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken);
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
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should send an email to recipient email address that is a group, get preferred email and get an ok', function(done) {
    chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['test@test.com']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.eql(['test@test.com']);
        done();
      });
  });

  it('should send an email to recipient email address that is a tilde group, get preferred email and get an ok', function(done) {
    chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['~Test_User1']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.eql(['test@test.com']);
        done();
      });
  });

  it('should send an email to recipient email address with different preferred email and get an ok', function(done) {

    chai.request(server)
    .post('/user/confirm')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + testToken)
    .send({
      alternate: 'alternate@mail.com',
      username: '~Test_User1'
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
        .put('/activatelink/alternate@mail.com')
        .set('User-Agent', 'test-create-script')
        .set('Authorization', 'Bearer ' + testToken);
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .get('/profiles')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('profiles');
      res.body.profiles.length.should.equal(1);
      res.body.profiles[0].id.should.be.equal('~Test_User1');
      res.body.profiles[0].content.should.have.property('names');
      res.body.profiles[0].content.names.should.be.a('array');
      res.body.profiles[0].content.names.length.should.equal(1);
      res.body.profiles[0].content.names[0].first.should.equal('Test');
      res.body.profiles[0].content.names[0].last.should.equal('User');
      res.body.profiles[0].content.names[0].username.should.equal('~Test_User1');
      res.body.profiles[0].content.should.have.property('emails');
      res.body.profiles[0].content.emails.should.be.a('array');
      res.body.profiles[0].content.emails.should.eql(['test@test.com', 'alternate@mail.com']);
      res.body.profiles[0].content.should.have.property('preferredEmail');
      res.body.profiles[0].content.preferredEmail.should.equal('test@test.com');
      var profile = res.body.profiles[0];
      profile.content.preferredEmail = 'alternate@mail.com';
      return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + testToken)
      .set('User-Agent', 'test-create-script')
      .send(profile);
    })
    .then(function(res) {
      res.should.have.status(200);
      res.body.content.preferredEmail.should.equal('alternate@mail.com');
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['test@test.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.should.eql(['alternate@mail.com']);
      done();
    })
    .catch(function(err) {
      done(err);
    })
  });

  it('should send an email to recipient tilde id different than the profile id get an ok', function(done) {

    chai.request(server)
    .post('/profiles')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + testToken)
    .send({
      referent: '~Test_User1',
      content: {
        names: [
          {
            first: 'Test',
            last: 'AnotherName'
          }
        ]
      },
      signatures: ['~Test_User1']
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.content.names.length.should.equal(2);
      res.body.content.names[0].username.should.equal('~Test_User1');
      res.body.content.names[1].username.should.equal('~Test_AnotherName1');
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['~Test_AnotherName1']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.should.eql(['alternate@mail.com']);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('should send an email to recipient email address that is a tilde group, get preferred alternate email and get an ok', function(done) {
    chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['~Test_User1']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.eql(['alternate@mail.com']);
        done();
      });
  });

  it('should send an email to duplicated recipient, send the email to an only preferred email and get an ok', function(done) {
    chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['~Test_User1', 'test@test.com', 'alternate@mail.com']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.eql(['alternate@mail.com']);
        done();
      });
  });

  it('should send an email to two different emails, send the email to an only preferred email and get an ok', function(done) {
    chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['~Test_User1', 'test@test.com', 'alternate@mail.com', 'melisa@mail.com']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('groups');
        res.body.groups.should.eql(['alternate@mail.com', 'melisa@mail.com']);
        done();
      });
  });

  it('should send an email to the members of the group id, send the email to an only preferred email and get an ok', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'xyz.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': [user],
        'readers': [user],
        'signatories': [user]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['xyz.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.should.eql(['alternate@mail.com']);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });


  it('should send an email to all the members of the group id, send the email to an only preferred email and get an ok', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'xyz.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': [user, 'melisa@mail.com', '~Test_User1'],
        'readers': [user],
        'signatories': [user]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['xyz.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.length.should.equal(2);
      res.body.groups.should.include('melisa@mail.com');
      res.body.groups.should.include('alternate@mail.com');
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should send an email to the transitive members of the group id, send the email to an only preferred email and get an ok', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'abc.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': ['xyz.com'],
        'readers': [user],
        'signatories': [user]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['abc.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.length.should.equal(2);
      res.body.groups.should.include('melisa@mail.com');
      res.body.groups.should.include('alternate@mail.com');
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should send an email to the transitive members of all the groups, send the email to an only preferred email and get an ok', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'abc.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': ['xyz.com'],
        'readers': [user],
        'signatories': [user]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['abc.com', 'xyz.com', '~Super_User1']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.length.should.equal(3);
      res.body.groups.should.include('melisa@mail.com');
      res.body.groups.should.include('alternate@mail.com');
      res.body.groups.should.include(superUser);
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should send an email to the transitive members of all the groups, and remove the duplicates', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'abc.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': ['a@mail.com', 'b@mail.com', 'c@mail.com'],
        'readers': [user],
        'signatories': [user]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
        .post('/groups')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'bc.com',
          'signatures': ["~Test_User1"],
          'writers': [user],
          'members': ['b@mail.com', 'c@mail.com'],
          'readers': [user],
          'signatories': [user]
        });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['abc.com', 'bc.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.length.should.equal(3);
      res.body.groups.should.include('a@mail.com');
      res.body.groups.should.include('b@mail.com');
      res.body.groups.should.include('c@mail.com');
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['abc.com', 'bc.com'],
        ignoreGroups: ['b@mail.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.length.should.equal(2);
      res.body.groups.should.include('a@mail.com');
      res.body.groups.should.include('c@mail.com');
      done();
    })
    .catch(function(err) {
      done(err);
    });

  });

  it('should send an email to a  tilde id with non existent profile and ignore it', function(done) {

    chai.request(server)
    .post('/mail')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + testToken)
    .send({
      subject: 'Subject',
      message: 'Test',
      groups: ['~Unknown_Profile1']
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Error');
      res.body.status.should.equal(400);
      res.body.message.should.equal('No preferred email for ~Unknown_Profile1');
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('should send an email with no emailable group and throw an error', function(done) {

    chai.request(server)
    .post('/mail')
    .set('User-Agent', 'test-create-script')
    .set('Authorization', 'Bearer ' + testToken)
    .send({
      subject: 'Subject',
      message: 'Test',
      groups: ['ICLR.cc/2019/Conference/Program_Chair']
    })
    .then(function(res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal('Error');
      res.body.status.should.equal(400);
      res.body.message.should.equal('No preferred email for ICLR.cc/2019/Conference/Program_Chair');
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('should do not send any email when the recipient is the same as the ignore group', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        'id': 'abc.com',
        'signatures': ["~Test_User1"],
        'writers': [user],
        'members': ['~Test_User1'],
        'readers': [user],
        'signatories': [user]
      })
    .then(function(result) {
      return chai.request(server)
      .post('/mail')
      .set('User-Agent', 'test-create-script')
      .set('Authorization', 'Bearer ' + testToken)
      .send({
        subject: 'Subject',
        message: 'Test',
        groups: ['abc.com'],
        ignoreGroups: ['test@test.com']
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('groups');
      res.body.groups.length.should.equal(0);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

});
