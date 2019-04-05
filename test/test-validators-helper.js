
var chai = require('chai');
var should = chai.should();
var validator = require('../helpers/validators');

describe('Validators', function() {

  it('VAL', function(done) {

    var terms = validator.validateSearchTerm('non-hyphenated');
    terms.should.equal('non hyphenated');

    terms = validator.validateSearchTerm('field:test');
    terms.should.equal('field test');

    terms = validator.validateSearchTerm('\'single quote\'');
    terms.should.equal('single quote');

    terms = validator.validateSearchTerm('"double quote"');
    terms.should.equal('double quote');

    terms = validator.validateSearchTerm('"double" "quote"');
    terms.should.equal('double quote');

    terms = validator.validateSearchTerm('"double"-"quote"');
    terms.should.equal('double quote');

    terms = validator.validateSearchTerm('"double"  -  "quote"');
    terms.should.equal('double quote');

    terms = validator.validateSearchTerm('`back `quote');
    terms.should.equal('back quote');

    terms = validator.validateSearchTerm('under_score');
    terms.should.equal('under_score');

    // we remove all single character terms UNLESS they are the last term
    terms = validator.validateSearchTerm('at @ s@t');
    terms.should.equal('at t');

    terms = validator.validateSearchTerm('a, b, & c. 1, 2, 3! Right?');
    terms.should.equal('Right');

    done();

  });

});
