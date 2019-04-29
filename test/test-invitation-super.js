var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);



describe('InvitationSuper', function() {

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

  it('should create a super invitation and its child', function(done) {
    utils.createGroupP('workshop', superUser, superToken, [superUser, user])
    .then(function(response) {
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop/-/super',
          'final': ['signatures'],
          'signatures': [superUser],
          'writers': [superUser],
          'invitees': [user, 'melisa@mail.com'],
          'readers': ['everyone'],
          'nonreaders': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              title: {
                order: 1,
                'value-regex': '.{0,5}',
                description: 'Brief summary of your review.',
                required: true
              },
              description: {
                order: 2,
                'value-regex': '.{0,500}',
                description: 'description field',
                required: true
              }

            }
          }
        });
    })
    .then(function(response){
      return chai.request(server)
        .get('/invitations?id=workshop/-/super')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      response.should.be.json;
      response.body.should.be.a('object');
      response.body.should.have.property('invitations');
      response.body.invitations.should.be.a('array');
      response.body.invitations.length.should.not.equal(0);
      response.body.invitations[0].should.have.property('id');
      response.body.invitations[0].should.have.property('nonreaders');
      response.body.invitations[0].should.have.property('readers');
      response.body.invitations[0].should.have.property('writers');
      response.body.invitations[0].should.not.have.property('noninvitees');
      response.body.invitations[0].signatures.should.eql([superUser]);
      response.body.invitations[0].writers.should.eql([superUser]);
      response.body.invitations[0].invitees.should.eql([user, 'melisa@mail.com']);
      response.body.invitations[0].readers.should.eql(['everyone']);
      response.body.invitations[0].nonreaders.should.eql([]);
      response.body.invitations[0].final.should.eql(['signatures']);
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'workshop/-/super/1',
          super: 'workshop/-/super',
          signatures: [superUser]
        });
    })
    .then(function(response) {
      utils.assertIdResponse(response);
      response.body.id.should.equal('workshop/-/super/1');
      response.body.super.should.equal('workshop/-/super');
      response.body.signatures.should.eql([superUser]);
      response.body.should.not.have.property('reply');
      response.body.should.not.have.property('web');
      response.body.should.not.have.property('process');
      return chai.request(server)
        .post('/notes')
        .set('Authorization', 'Bearer ' + testToken)
        .set('User-Agent', 'test-create-script')
        .send({
          invitation: 'workshop/-/super/1',
          readers: ['everyone'],
          writers: [user],
          signatures: [user],
          content: {
            title: 'this is a long title'
          }
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
      res.body.errors.length.should.equal(2);
      res.body.errors[0].type.should.equal('notMatch');
      res.body.errors[0].path.should.equal('content.title');
      res.body.errors[0].value.should.equal('this is a long title');
      res.body.errors[1].type.should.equal('missing');
      res.body.errors[1].path.should.equal('content.description');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  // ACS: why is the the invitation super field specified explicitly? isn't it just hierarchical, e.g., 'group/-/inv1/inv2/inv3' ?
  it('should create a child invitation with an invalid super and get a bad request', function(done) {
    chai.request(server)
      .post('/invitations')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
          id: 'workshop/-/super/2',
          super: 'workshop/-/nonexistent'
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
        res.body.errors[0].type.should.equal('Not Found');
        res.body.errors[0].path.should.equal('invitation.super');
        res.body.errors[0].value.should.equal('workshop/-/nonexistent');
        done();
      })
  });

  // ACS: super/sub invite fields have some overridable fields, others are immutable, correct?
  it('should create a super invitation, override a final value and get an error', function(done) {
    utils.createGroupP('workshop2', superUser, superToken, [superUser, user])
    .then(function(response) {
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop2/-/super',
          'final': ['signatures'],
          'signatures': [superUser],
          'writers': [superUser],
          'invitees': [user, 'melisa@mail.com'],
          'readers': ['everyone'],
          'nonreaders': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              title: {
                order: 1,
                "value-regex": ".{0,500}",
                description: "Brief summary of your review."
              },
              description: {
                order: 2,
                "value-regex": ".{0,500}",
                description: "description field"
              }

            }
          }
        });
    })
    .then(function(response){
      return chai.request(server)
        .get('/invitations?id=workshop2/-/super')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'workshop2/-/super/1',
          super: 'workshop2/-/super',
          signatures: [user]
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
          res.body.errors[0].type.should.equal('can not override final field');
          res.body.errors[0].path.should.equal('invitation[signatures]');
          res.body.errors[0].value.should.eql([ 'test@test.com' ]);
          done();
        });
    })
    .catch(function(error) {
      done(error);
    })

  });

  it('should create a super invitation, override a final value with the same value and get an ok', function(done) {
    utils.createGroupP('workshop3', superUser, superToken, [superUser, user])
    .then(function(response) {
      return chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          'id': 'workshop3/-/super',
          'final': ['signatures'],
          'signatures': [superUser],
          'writers': [superUser],
          'invitees': [user, 'melisa@mail.com'],
          'readers': ['everyone'],
          'nonreaders': [],
          'reply' : {
            readers: { 'values-regex': '.+' },
            signatures: { 'values-regex': '.+' },
            writers: { 'values-regex': '.+' },
            content: {
              title: {
                order: 1,
                "value-regex": ".{0,500}",
                description: "Brief summary of your review."
              },
              description: {
                order: 2,
                "value-regex": ".{0,500}",
                description: "description field"
              }

            }
          }
        });
    })
    .then(function(response){
      return chai.request(server)
        .get('/invitations?id=workshop3/-/super')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script');
    })
    .then(function(response) {
      response.should.have.status(200);
      chai.request(server)
        .post('/invitations')
        .set('Authorization', 'Bearer ' + superToken)
        .set('User-Agent', 'test-create-script')
        .send({
          id: 'workshop3/-/super/1',
          super: 'workshop3/-/super',
          signatures: [superUser]
        })
        .end(function(err, res) {
          utils.assertIdResponse(res);
          done();
        });
    })
    .catch(function(error) {
      done(error);
    })

  });

});
