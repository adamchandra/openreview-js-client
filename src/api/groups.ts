//

import cmds from 'commander';
import _ from 'lodash';

cmds
  .option('-l, --list <items>', 'A list')
;

cmds.parse(process.argv);

//   createSimpleRootGroupP('abc.com', { readers: ['everyone'] })
//     .then(function() {
//       return chai.request(server)
//         .get('/groups?id=abc.com')
//         .set('Authorization', 'Bearer ' + superToken)
//         .set('User-Agent', 'test-create-script');
//     })
//     .then(function(res) {
//       res.should.have.status(200);
//       res.should.be.json;
//       res.body.should.be.a('object');
//       res.body.should.have.property('groups');
//       res.body.groups.should.be.a('array');
//       res.body.groups.length.should.equal(1);
//       res.body.groups[0].should.have.property('tauthor');
//       res.body.groups[0].tauthor.should.equal(superUser);
//       return chai.request(server)
//         .get('/groups?id=abc.com')
//         .set('Authorization', 'Bearer ' + testToken)
//         .set('User-Agent', 'test-create-script');
//     })
