var config= require('config-lite')({
  config_basedir: __dirname
});
var usersModel= require('../models/core')('Users');

module.exports= {
  checkIsAdmin: function checkIsLogin(req, res, next) {
    if(req.session.username){
      if(req.method.toLowerCase() === 'get' && !((['/estimation', '/worklog'].indexOf(req.path) != -1) && req.query.refresh == 'y')){
        next();
      }else{
        if(req.query.module){
          usersModel.findOne({'username': req.session.username}, function(resData){
            if((resData && resData.permission >= 2 && ((resData.modules || []).indexOf(req.query.module)) != -1) || (resData && resData.permission >= 9)){
              next();
            }else{  
              res.send({
                status: 'error',
                resMsg: 'Sorry, you have no permission to take this action!'
              });
              return false;          
            }
          }, res);          
        }else{
          res.send({
            status: 'error',
            resMsg: 'Please choose module first!'
          });
          return false;            
        }
      }      
    }else{
      req.session.cookie.expires= new Date();
      res.send({
        status: 'error',
        resMsg: 'Please login first!',
        redirect: '/#/admin/login'
      });
      return false;       
    }
  },

  checkIsSuperAdmin: function checkIsSuperAdmin(req, res, next) {
    if(req.query.username && req.query.pwd){
      usersModel.findOne({'username': req.query.username}, function(resData){
        if(resData && resData.permission > 9 && resData.password == req.query.pwd){
          next();
        }else{  
          res.send({
            status: 'error',
            resMsg: 'Sorry, you have no permission to take this action!'
          });
          return false;          
        }
      }, res);
    }else{
      req.session.cookie.expires= new Date();
      res.send({
        status: 'error',
        resMsg: 'Sorry, you have no permission to take this action!'
      });
      return false;       
    }
  }
}