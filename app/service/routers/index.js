var bodyParser = require('body-parser');

module.exports= function(app){
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization,\'Origin\',Accept,X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('X-Powered-By', ' 3.2.1');
    res.header('Content-Type', 'text/html');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
  });
    
  app.use('/', require('./home'));
  app.use('/admin', require('./admin'));
  app.use('/admin/sprint', require('./api/sprint'));
  app.use('/admin/stories', require('./api/stories'));
  app.use('/admin/dashboard', require('./api/dashboard'));
  app.use('/admin/modules', require('./api/modules'));
  app.use('/admin/planning', require('./api/planning'));
  app.use('/admin/groups', require('./api/groups'));
  app.use('/admin/usermaps', require('./api/usermaps'));
  app.use('/admin/tools', require('./api/tools'));
  app.use('/api/v1', require('./api/public'));
}