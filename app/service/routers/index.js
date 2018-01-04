var bodyParser = require('body-parser');

module.exports= function(app){
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use('/', require('./home'));
  app.use('/admin', require('./admin'));
}