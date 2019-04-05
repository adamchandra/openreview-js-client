var chai = require('chai');

const ProfileInference = require('../inference/profiles');

describe('ProfileInference', function() {

  it('should inference an empty collection and return an empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([]);

    result.should.be.a('object');
    result.should.eql({
      content: {},
      metaContent: {}
    });

    done();

  });

  it('should inference an single reference with null values and return an empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Test_User1'],
      content: {
        homepage: null,
        names: null
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {},
      metaContent: {}
    });

    done();

  });

  it('should inference a single reference with a homepage and return an content with a homepage', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Test_User1'],
      content: {
        homepage: 'http://homepage.do'
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Test_User1']
        }
      }
    });

    done();

  });

  it('should inference a single reference with a homepage negation and return an empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Test_User2'],
      metaContent: {
        homepage: {
          values: ['http://test'],
          weights: [-1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {},
      metaContent: {}
    });

    done();

  });

  it('should inference two references with a homepage value and return last one in the content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://new.homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Test_User2']
        }
      }
    });

    done();

  });

  it('should inference two references with a homepage value, removing the duplicates and return last one in the content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 3000,
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://new.homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Test_User2']
        }
      }
    });

    done();

  });

  it('should inference two references with a homepage value, do not remove the owner duplicates and return last one in the content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Melisa_Test1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 3000,
        signatures: ['~Melisa_Test1'],
        metaContent: {
          homepage: {
            values: ['http://homepage.do'],
            weights: [-1]
          }
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Melisa_Test1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Melisa_Test1']
        }
      }
    });

    done();

  });

  it('should inference three owner references with a homepage value, keep the last one in the content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Melisa_Test1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 3000,
        signatures: ['~Melisa_Test1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Melisa_Test1'],
        metaContent: {
          homepage: {
            values: ['http://homepage.do'],
            weights: [-1]
          }
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
      },
      metaContent: {
      }
    });

    done();

  });


  it('should inference two references with a homepage value and return one the owner of the profile submitted', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Melisa_Test1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Melisa_Test1']
        }
      }
    });

    done();

  });

  it('should inference three references with a homepage value and return no content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Melisa_Test1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Melisa_Test1'],
        metaContent: {
          homepage: {
            values: ['http://homepage.do'],
            weights: [-1]
          }
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
      },
      metaContent: {
      }
    });

    done();

  });

  it('should inference two references with a homepage value and the sum pf weights is 0 and return an empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 2000,
        signatures: ['~Test_User1'],
        metaContent: {
          homepage: {
            values: ['http://homepage.do'],
            weights: [-1]
          }
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {

      },
      metaContent: {
      }
    });

    done();

  });

  it('should inference three references with a homepage value and the last one is empty and return an emoty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User1'],
        content: {
        },
        metaContent: {
          homepage: {
            values: ['http://new.homepage.do'],
            weights: [-1]
          }
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Test_User1']
        }
      }
    });

    done();

  });

  it('should inference three references with a homepage value and the middle one is negative and return the last one in the content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 6000,
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now() - 2000,
        signatures: ['~Test_User1'],
        metaContent: {
          homepage: {
            values: ['http://homepage.do'],
            weights: [-1]
          }
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://new.homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Test_User2']
        }
      }
    });

    done();

  });

  it('should inference three references with a homepage value with different weights and return the higher weights one in the content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User1'],
        content: {
          homepage: 'http://homepage.do'
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        metaContent: {
          homepage: {
            values: ['http://homepage.do'],
            weights: [1]
          }
        }
      },
      {
        referent: '~Melisa_Test1',
        tcdate: Date.now(),
        signatures: ['~Test_User2'],
        content: {
          homepage: 'http://new.homepage.do'
        }
      }
    ]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        homepage: 'http://homepage.do'
      },
      metaContent: {
        homepage: {
          signatures: ['~Test_User1', '~Test_User2']
        }
      }
    });

    done();

  });

  it('should inference a two references with a name record and return an content with a name and preferred value changed', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 50000,
      signatures: ['~Melisa_Test1'],
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: true
          },
          {
            first: 'Melisa',
            last: 'TestBok',
            username: '~Melisa_TestBok1'
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Melisa_Test1'],
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: false
          },
          {
            first: 'Melisa',
            last: 'TestBok',
            username: '~Melisa_TestBok1',
            preferred: true
          }
        ]
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: false
          },
          {
            first: 'Melisa',
            last: 'TestBok',
            username: '~Melisa_TestBok1',
            preferred: true
          }
        ]
      },
      metaContent: {
        names: [
          {
            signatures: ['~Melisa_Test1']
          },
          {
            signatures: ['~Melisa_Test1']
          }
        ]
      }
    });

    done();

  });

  it('should inference a two references with a name record, one positive and negative, and return an empty name', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 50000,
      signatures: ['~Melisa_Test1'],
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: true
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 30000,
      signatures: ['~Researcher'],
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'TestBok',
            username: '~Melisa_TestBok1'
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 2000,
      signatures: ['~Melisa_Test1'],
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'TestBok',
            username: '~Melisa_TestBok1'
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Melisa_Test1'],
      metaContent: {
        names: {
          values: [
            {
              first: 'Melisa',
              last: 'TestBok',
              username: '~Melisa_TestBok1'
            }
          ],
          weights: [-1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        names: [
          {
            first: 'Melisa',
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: true
          }
        ]
      },
      metaContent: {
        names: [
          {
            signatures: ['~Melisa_Test1']
          }
        ]
      }
    });

    done();

  });


  it('should inference a single reference with a history record and return an content with a history value', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User1']
          }
        ]
      }
    });

    done();

  });

  it('should inference a single reference with an empty history record and return an empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      content: {
        history: []
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {},
      metaContent: {}
    });

    done();

  });


  it('should inference two references with a history record, last one is empty and return an non empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      content: {
        history: []
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User1']
          }
        ]
      }
    });

    done();

  });

  it('should inference two references with a history record, last one changes the start date of the first one and return an non empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: null,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Test_User2'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2010,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User1', '~Test_User2']
          }
        ]
      }
    });

    done();

  });

   it('should inference two references with a history record, keep only owner evidence return an non empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Melisa_Test1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: null,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Test_User2'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2010,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            },
            {
              position: 'Researcher',
              start: 2006,
              end: 2008,
              institution: {
                domain: 'google.com',
                name: 'Google Inc'
              }
            }
          ],
          weights: [1, 1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: null,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Researcher',
            start: 2006,
            end: 2008,
            institution: {
              domain: 'google.com',
              name: 'Google Inc'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Melisa_Test1']
          },
          {
            signatures: ['~Test_User2']
          }
        ]
      }
    });

    done();

  });

  it('should inference two references with a history record, merge the date periods and return an non empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: 2014,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Test_User2'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2015,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2015,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Developer',
            start: 2010,
            end: 2014,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User2']
          },
          {
            signatures: ['~Test_User1']
          }
        ]
      }
    });

    done();

  });

  it('should inference two references with a history record, merge the date periods and return a single record content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: 2014,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Test_User2'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2014,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User1', '~Test_User2']
          }
        ]
      }
    });

    done();

  });

  it('should inference two references with a history record, merge the date periods and return a single record with different period content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2014,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Test_User2'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2010,
              end: 2015,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User2', '~Test_User1']
          }
        ]
      }
    });

    done();

  });

  it('should inference a reference with more than a history record and return the history records sorted', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2014,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Researcher',
            start: 2016,
            end: null,
            institution: {
              domain: 'mit.edu',
              name: 'MIT'
            }
          }
        ]
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Researcher',
            start: 2016,
            end: null,
            institution: {
              domain: 'mit.edu',
              name: 'MIT'
            }
          },
          {
            position: 'Developer',
            start: 2014,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User1']
          },
          {
            signatures: ['~Test_User1']
          }
        ]
      }
    });

    done();

  });

  it('should change institution name and get updated in the profile', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Melisa_Test1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2014,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Researcher',
            start: 2016,
            end: null,
            institution: {
              domain: 'mit.edu',
              name: 'MIT'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Melisa_Test1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2014,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Univeristy of Massachusetts'
            }
          }
        ]
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Researcher',
            start: 2016,
            end: null,
            institution: {
              domain: 'mit.edu',
              name: 'MIT'
            }
          },
          {
            position: 'Developer',
            start: 2014,
            end: 2016,
            institution: {
              domain: 'umass.edu',
              name: 'Univeristy of Massachusetts'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Melisa_Test1']
          },
          {
            signatures: ['~Melisa_Test1']
          }
        ]
      }
    });

    done();

  });




  it('should inference two owner profile references with a history record and keep only the last one', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Melisa_Test1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: null,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Melisa_Test1'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2010,
              end: 2015,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: 2015,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Melisa_Test1']
          }
        ]
      }
    });

    done();

  });

  it('should inference two owner profile references, one with only start date, with a history record and keep only the last one', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Melisa_Test1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2008,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Melisa_Test1'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2010,
              end: 2015,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Developer',
            start: 2010,
            end: 2015,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Melisa_Test1']
          }
        ]
      }
    });

    done();

  });

  it('should inference two owner profile references, one negative, with a history record and get an empty result', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      tcdate: Date.now() - 5000,
      signatures: ['~Melisa_Test1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2008,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      referent: '~Melisa_Test1',
      tcdate: Date.now(),
      signatures: ['~Melisa_Test1'],
      metaContent: {
        history: {
          values: [
            {
              position: 'Developer',
              start: 2008,
              end: null,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [-1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
      },
      metaContent: {
      }
    });

    done();

  });

  it('should inference two references to delete a history record and return a content with a single history', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      tcdate: Date.now(),
      referent: '~Melisa_Test1',
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Researcher',
            start: 2018,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      tcdate: Date.now(),
      referent: '~Melisa_Test1',
      signatures: ['~Test_User2'],
      content: {
        history: [
          {
            position: 'Research Assistant',
            start: 2018,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: {
          values: [
           {
              position: 'Researcher',
              start: 2018,
              end: null,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ],
          weights: [-1]
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Research Assistant',
            start: 2018,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Developer',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User2']
          },
          {
            signatures: ['~Test_User1']
          }
        ]
      }
    });

    done();

  });

  it('should inference two references with history record and return a content with an overwritten history', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      tcdate: Date.now(),
      referent: '~Melisa_Test1',
      signatures: ['~Test_User1'],
      content: {
        history: [
          {
            position: 'MS Student',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Researcher',
            start: 2018,
            end: null,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      tcdate: Date.now(),
      referent: '~Melisa_Test1',
      signatures: ['~Test_User2'],
      content: {
        history: [
          {
            position: 'Researcher',
            start: 2016,
            end: 2020,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ]
      }
    },
    {
      tcdate: Date.now(),
      referent: '~Melisa_Test1',
      signatures: ['~Test_User3'],
      content: {
        history: [
          {
            position: 'Developer',
            start: 2006,
            end: 2015,
            institution: {
              domain: 'fi.ubar.ar',
              name: 'Engineer School'
            }
          }
        ]
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {
        history: [
          {
            position: 'Researcher',
            start: 2016,
            end: 2020,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'MS Student',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          },
          {
            position: 'Developer',
            start: 2006,
            end: 2015,
            institution: {
              domain: 'fi.ubar.ar',
              name: 'Engineer School'
            }
          }
        ]
      },
      metaContent: {
        history: [
          {
            signatures: ['~Test_User2', '~Test_User1']
          },
          {
            signatures: ['~Test_User1']
          },
          {
            signatures: ['~Test_User3']
          }
        ]
      }
    });

    done();

  });

  it('should inference one reference with a full profile and get a non empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Melisa_Bok1'],
      content: {
        preferredEmail: 'melisa@mail.com',
        gender: 'Female',
        homepage: 'http://homepage',
        gscholar: 'http://gscholar',
        dblp: 'http://dblp',
        wikipedia: 'http://wikipedia',
        linkedin: 'http://linkedin',
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ],
        names: [
          {
            first: 'Melisa',
            middle: null,
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: true
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
        ],
        expertise: [
          {
            keywords: ['machine learning'],
            start: 2016,
            end: null
          }
        ],
        emails: [
          'melisa@mail.com'
        ]
      }
    }]);
    result.should.be.a('object');
    result.should.eql({
      content: {
        preferredEmail: 'melisa@mail.com',
        gender: 'Female',
        homepage: 'http://homepage',
        gscholar: 'http://gscholar',
        dblp: 'http://dblp',
        wikipedia: 'http://wikipedia',
        linkedin: 'http://linkedin',
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ],
        names: [
          {
            first: 'Melisa',
            middle: null,
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: true
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
        ],
        expertise: [
          {
            keywords: ['machine learning'],
            start: 2016,
            end: null
          }
        ],
        emails: ['melisa@mail.com']
      },
      metaContent: {
        preferredEmail: {
          signatures: ['~Melisa_Bok1']
        },
        gender: {
          signatures: ['~Melisa_Bok1']
        },
        homepage: {
          signatures: ['~Melisa_Bok1']
        },
        gscholar: {
          signatures: ['~Melisa_Bok1']
        },
        dblp: {
          signatures: ['~Melisa_Bok1']
        },
        wikipedia: {
          signatures: ['~Melisa_Bok1']
        },
        linkedin: {
          signatures: ['~Melisa_Bok1']
        },
        history: [
          {
            signatures: ['~Melisa_Bok1']
          }
        ],
        names: [
          {
            signatures: ['~Melisa_Bok1']
          }
        ],
        relations: [
          {
            signatures: ['~Melisa_Bok1']
          }
        ],
        expertise: [
          {
            signatures: ['~Melisa_Bok1']
          }
        ],
        emails: [{
          signatures: ['~Melisa_Bok1']
        }]
      }
    });

    done();

  });

  it('should inference two references with a full profile and get a empty content', function(done) {

    const profileInference = new ProfileInference();

    const result = profileInference.infer([{
      referent: '~Melisa_Test1',
      signatures: ['~Melisa_Bok1'],
      content: {
        preferredEmail: 'melisa@mail.com',
        gender: 'Female',
        homepage: 'http://homepage',
        gscholar: 'http://gscholar',
        dblp: 'http://dblp',
        wikipedia: 'http://wikipedia',
        linkedin: 'http://linkedin',
        history: [
          {
            position: 'Developer',
            start: 2016,
            end: 2018,
            institution: {
              domain: 'umass.edu',
              name: 'Umass'
            }
          }
        ],
        names: [
          {
            first: 'Melisa',
            middle: null,
            last: 'Bok',
            username: '~Melisa_Bok1',
            preferred: true
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
        ],
        expertise: [
          {
            keywords: ['machine learning'],
            start: 2016,
            end: null
          }
        ],
        emails: [
          'melisa@mail.com'
        ]
      }
    },
    {
      signatures: ['~Melisa_Bok1'],
      metaContent: {
        preferredEmail: {
          weights: [-1],
          values: ['melisa@mail.com']
        },
        gender: {
          weights: [-1],
          values: ['Female']
        },
        homepage: {
          weights: [-1],
          values: ['http://homepage']
        },
        gscholar: {
          weights: [-1],
          values: ['http://gscholar']
        },
        dblp: {
          weights: [-1],
          values: ['http://dblp']
        },
        wikipedia: {
          weights: [-1],
          values: ['http://wikipedia']
        },
        linkedin: {
          weights: [-1],
          values: ['http://linkedin']
        },
        history: {
          weights: [-1],
          values: [
            {
              position: 'Developer',
              start: 2016,
              end: 2018,
              institution: {
                domain: 'umass.edu',
                name: 'Umass'
              }
            }
          ]
        },
        names: {
          weights: [-1],
          values: [
            {
              first: 'Melisa',
              middle: null,
              last: 'Bok',
              username: '~Melisa_Bok1',
              preferred: true
            }
          ]
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
        },
        expertise: {
          weights: [-1],
          values: [{
            keywords: ['machine learning'],
            start: 2016,
            end: null
          }]
        },
        emails: {
          weights: [-1],
          values: ['melisa@mail.com']
        }
      }
    }]);

    result.should.be.a('object');
    result.should.eql({
      content: {},
      metaContent: {}
    });

    done();

  });


});
