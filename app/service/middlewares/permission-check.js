var config= require('config-lite')({
  config_basedir: __dirname
});

module.exports= {
  checkIsAdmin: function checkIsLogin(req, res, next) {
    if(!req.session.user){
      res.redirect('/');
      return false;
    }
    next();
  }
}