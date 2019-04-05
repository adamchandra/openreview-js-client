var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var utils = require('./testUtils');

chai.use(chaiHttp);


describe('RegisterWithProfile', function() {

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

 it('should register with an unknown username and get an error', function(done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
      	id: '~Melisa_Bok1',
        email: 'mbok@mail.com',
        password: '12345678'
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
        res.body.errors[0].should.equal('Username not found');
        done();
			});
 });

 	it('should register with an active profile and get an error', function(done) {
    chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
      	id: '~Test_User1',
        email: 'test@test.com',
        password: '12345678'
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
        res.body.errors[0].should.equal('A user with that email address already exists');
        done();
			});
 	});

  it('should register an user, try to register it again and get an error', function(done) {
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
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        res.body.id.should.equal('~Melisa_Bok1');
        res.body.active.should.equal(false);
        res.body.content.preferredEmail.should.equal('melisa@gmail.com');
        res.body.content.emails.length.should.equal(1);
        res.body.content.emails[0].should.equal('melisa@gmail.com');
        res.body.content.names.length.should.equal(1);
        res.body.content.names[0].first.should.equal('Melisa');
        res.body.content.names[0].middle.should.equal('');
        res.body.content.names[0].last.should.equal('Bok');
        res.body.content.names[0].username.should.equal('~Melisa_Bok1');
		    chai.request(server)
		      .post('/register')
		      .set('User-Agent', 'test-create-script')
		      .send({
		      	id: '~Melisa_Bok1',
            email: 'melisa@gmail.com',
		        password: '12345678'
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
		        res.body.errors[0].should.equal('User not confirmed. Please click on "Didn\'t receive email confirmation?" to complete the activation.');
		        done();
					});
      });
  });

  it('should register an user with an pre-existent profile and get an ok', function(done) {

  	chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa3@gmail.com',
	      members: ['~Melisa_Bok3'],
	      readers: ['melisa3@gmail.com'],
	      nonreaders: [],
	      signatories: ['melisa3@gmail.com'],
	      signatures: [superUser],
	      writers: [superUser]
      })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok3',
	      members: ['melisa3@gmail.com'],
	      readers: ['~Melisa_Bok3'],
	      nonreaders: [],
	      signatories: ['~Melisa_Bok3'],
	      signatures: [superUser],
	      writers: [superUser]
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok3',
	      content: {
	      	emails: ['melisa3@gmail.com'],
	      	preferredEmail: 'melisa3@gmail.com',
	      	names: [
	      		{
	      			first: 'Melisa',
	      			middle: '',
	      			last: 'Bok',
	      			username: '~Melisa_Bok3',
              preferred: true
	      		}
	      	]
	      }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok3',
        email: 'melisa99@gmail.com',
        password: '12345678'
      });
    })
    .then(function(res) {
    	res.should.have.status(400);
      res.body.status.should.equals(400);
      res.body.message.should.equals('Email melisa99@gmail.com does not belong to the profile ~Melisa_Bok3');
    	return chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
      	id: '~Melisa_Bok3',
        email: 'melisa3@gmail.com',
        password: '12345678'
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.id.should.equal('~Melisa_Bok3');
      res.body.active.should.equal(false);
      res.body.content.preferredEmail.should.equal('melisa3@gmail.com');
      res.body.content.emails.length.should.equal(1);
      res.body.content.emails[0].should.equal('melisa3@gmail.com');
      res.body.content.names.length.should.equal(1);
      res.body.content.names[0].first.should.equal('Melisa');
      res.body.content.names[0].middle.should.equal('');
      res.body.content.names[0].last.should.equal('Bok');
      res.body.content.names[0].username.should.equal('~Melisa_Bok3');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });

  it('should register an user with an pre-existent profile, try to login before activation and get an error', function(done) {

  	chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa4@gmail.com',
	      members: ['~Melisa_Bok4'],
	      readers: ['melisa4@gmail.com'],
	      nonreaders: [],
	      signatories: ['melisa4@gmail.com'],
	      signatures: [superUser],
	      writers: [superUser]
      })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok4',
	      members: ['melisa4@gmail.com'],
	      readers: ['~Melisa_Bok4'],
	      nonreaders: [],
	      signatories: ['~Melisa_Bok4'],
	      signatures: [superUser],
	      writers: [superUser]
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok4',
	      content: {
	      	emails: ['melisa4@gmail.com'],
	      	preferredEmail: 'melisa4@gmail.com',
	      	names: [
	      		{
	      			first: 'Melisa',
	      			middle: '',
	      			last: 'Bok',
	      			username: '~Melisa_Bok4'
	      		}
	      	]
	      }
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
      	id: '~Melisa_Bok4',
        email: 'melisa4@gmail.com',
        password: '12345678'
      })
    })
    .then(function(res) {
    	res.should.have.status(200);
    	chai.request(server)
	    .post('/login')
	    .set('User-Agent', 'test-create-script')
	    .send({
	      'id': 'melisa4@gmail.com',
	      'password': '12345678'
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
        res.body.errors[0].should.equal('User not confirmed. Please click on "Didn\'t receive email confirmation?" to complete the activation.');
	    	done();
	    })
    })
    .catch(function(error) {
    	done(error);
    })

  });

  it('should register an user with an pre-existent profile, activate it, try to login and get an ok', function(done) {

  	chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa5@gmail.com',
	      members: ['~Melisa_Bok5'],
	      readers: ['melisa5@gmail.com'],
	      nonreaders: [],
	      signatories: ['melisa5@gmail.com'],
	      signatures: [superUser],
	      writers: [superUser]
      })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok5',
	      members: ['melisa5@gmail.com'],
	      readers: ['~Melisa_Bok5'],
	      nonreaders: [],
	      signatories: ['~Melisa_Bok5'],
	      signatures: [superUser],
	      writers: [superUser]
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok5',
	      content: {
	      	emails: ['melisa5@gmail.com'],
	      	preferredEmail: 'melisa5@gmail.com',
	      	names: [
	      		{
	      			first: 'Melisa',
	      			middle: '',
	      			last: 'Bok',
	      			username: '~Melisa_Bok5'
	      		}
	      	]
	      }
      });
    })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
      	id: '~Melisa_Bok5',
        email: 'melisa5@gmail.com',
        password: '12355678'
      })
    })
    .then(function(res) {
    	res.should.have.status(200);
    	return chai.request(server)
      .put('/activate/melisa5@gmail.com')
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok5',
        content: {
          emails: ['melisa5@gmail.com'],
          preferredEmail: 'melisa5@gmail.com',
          names: [
            {
              first: 'Melisa',
              middle: '',
              last: 'Bok',
              username: '~Melisa_Bok5'
            }
          ]
        }
      })
    })
    .then(function(res) {
    	res.should.have.status(200);
    	chai.request(server)
	    .post('/login')
	    .set('User-Agent', 'test-create-script')
	    .send({
	      'id': 'melisa5@gmail.com',
	      'password': '12355678'
	    })
	    .end(function(err, res) {
	    	res.should.have.status(200);
	    	done();
	    })
    })
    .catch(function(error) {
    	done(error);
    })

  });

  it('try to register with an email of an inactive profile and get an error ', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa6@gmail.com',
        members: ['~Melisa_Bok6'],
        readers: ['melisa6@gmail.com'],
        nonreaders: [],
        signatories: ['melisa6@gmail.com'],
        signatures: [superUser],
        writers: [superUser]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok6',
        members: ['melisa6@gmail.com'],
        readers: ['~Melisa_Bok6'],
        nonreaders: [],
        signatories: ['~Melisa_Bok6'],
        signatures: [superUser],
        writers: [superUser]
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok6',
        content: {
          emails: ['melisa6@gmail.com'],
          preferredEmail: 'melisa6@gmail.com',
          names: [
            {
              first: 'Melisa',
              middle: '',
              last: 'Bok',
              username: '~Melisa_Bok6'
            }
          ]
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        email: 'melisa6@gmail.com',
        password: '12345678',
        name: {
          first: 'Melisa',
          middle: 'another',
          last: 'Bok'
        }
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
        res.body.errors[0].should.have.string('This email is associated with an existing profile');
        done();
      });
    })

  });


  it('should register an user with an pre-existent profile two references, activate it, try to login and get an ok', function(done) {

    chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: 'melisa7@gmail.com',
        members: ['~Melisa_Bok7'],
        readers: ['melisa7@gmail.com'],
        nonreaders: [],
        signatories: ['melisa7@gmail.com'],
        signatures: [superUser],
        writers: [superUser]
      })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/groups')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok7',
        members: ['melisa7@gmail.com'],
        readers: ['~Melisa_Bok7'],
        nonreaders: [],
        signatories: ['~Melisa_Bok7'],
        signatures: [superUser],
        writers: [superUser]
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok7',
        content: {
          emails: ['melisa7@gmail.com'],
          preferredEmail: 'melisa7@gmail.com',
          names: [
            {
              first: 'Melisa',
              middle: '',
              last: 'Bok',
              username: '~Melisa_Bok7'
            }
          ]
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .post('/profiles')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script')
      .send({
        referent: '~Melisa_Bok7',
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://melisa.do'
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.id.should.equal('~Melisa_Bok7');
      res.body.content.should.have.property('preferredEmail');
      res.body.content.should.have.property('emails');
      res.body.content.should.have.property('names');
      res.body.content.should.have.property('homepage');
      res.body.metaContent.should.have.property('preferredEmail');
      res.body.metaContent.should.have.property('emails');
      res.body.metaContent.should.have.property('names');
      res.body.metaContent.should.have.property('homepage');
      res.body.metaContent.preferredEmail.signatures.should.eql(['~Melisa_Bok7']);
      res.body.metaContent.emails[0].signatures.should.eql(['~Melisa_Bok7']);
      res.body.metaContent.names[0].signatures.should.eql(['~Melisa_Bok7']);
      res.body.metaContent.homepage.signatures.should.eql(['~Test_User1']);
      return chai.request(server)
      .post('/register')
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok7',
        email: 'melisa7@gmail.com',
        password: '12355678'
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      return chai.request(server)
      .get('/references?referent=~Melisa_Bok7')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.references.length.should.equals(2);
      res.body.references[0].referent.should.equal('~Melisa_Bok7');
      res.body.references[0].content.homepage.should.equals('http://melisa.do');
      res.body.references[0].content.should.not.have.property('emails');
      res.body.references[0].content.should.not.have.property('names');
      res.body.references[0].content.should.not.have.property('preferredEmail');
      res.body.references[1].referent.should.equal('~Melisa_Bok7');
      res.body.references[1].content.should.have.property('emails');
      res.body.references[1].content.should.have.property('names');
      res.body.references[1].content.should.have.property('preferredEmail');
      res.body.references[1].content.should.not.have.property('homepage');
      return chai.request(server)
      .put('/activate/melisa7@gmail.com')
      .set('User-Agent', 'test-create-script')
      .send({
        id: '~Melisa_Bok7',
        content: {
          emails: ['melisa7@gmail.com'],
          preferredEmail: 'melisa7@gmail.com',
          names: [
            {
              first: 'Melisa',
              middle: '',
              last: 'Bok',
              username: '~Melisa_Bok7'
            }
          ],
          homepage: 'http://melisa.do',
          history: [
            {
              position: 'Developer',
              institution: {
                name: 'UBA',
                domain: 'uba.ar'
              }
            }
          ]
        }
      });
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      var token = res.body.token;
      return chai.request(server)
      .get('/profiles')
      .set('Authorization', 'Bearer ' + token)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.profiles[0].id.should.equal('~Melisa_Bok7');
      res.body.profiles[0].content.should.have.property('preferredEmail');
      res.body.profiles[0].content.should.have.property('emails');
      res.body.profiles[0].content.should.have.property('names');
      res.body.profiles[0].content.should.have.property('homepage');
      res.body.profiles[0].content.should.have.property('history');
      res.body.profiles[0].metaContent.should.have.property('preferredEmail');
      res.body.profiles[0].metaContent.should.have.property('emails');
      res.body.profiles[0].metaContent.should.have.property('names');
      res.body.profiles[0].metaContent.should.have.property('homepage');
      res.body.profiles[0].metaContent.should.have.property('history');
      res.body.profiles[0].metaContent.preferredEmail.signatures.should.eql(['~Melisa_Bok7']);
      res.body.profiles[0].metaContent.emails[0].signatures.should.eql(['~Melisa_Bok7']);
      res.body.profiles[0].metaContent.names[0].signatures.should.eql(['~Melisa_Bok7']);
      res.body.profiles[0].metaContent.homepage.signatures.should.eql(['~Test_User1']);
      res.body.profiles[0].metaContent.history[0].signatures.should.eql(['~Melisa_Bok7']);
      return chai.request(server)
      .get('/references?referent=~Melisa_Bok7')
      .set('Authorization', 'Bearer ' + superToken)
      .set('User-Agent', 'test-create-script');
    })
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.references.length.should.equals(3);
      res.body.references[0].content.should.have.property('history');
      res.body.references[1].content.should.have.property('homepage');
      res.body.references[2].content.should.have.property('preferredEmail');
      res.body.references[2].content.should.have.property('emails');
      res.body.references[2].content.should.have.property('names');
      done();
    })
    .catch(function(error) {
      done(error);
    });

  });


});
