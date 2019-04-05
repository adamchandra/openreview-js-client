process.on('message', function(config) {
  process.env.NODE_ENV = 'test';

  var instanceServer = require('../server')(function() {
    process.send('ready');
  });
});
