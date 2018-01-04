var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../middlewares/permission-check').checkIsAdmin;
var usersModel= require('../models/core')('Users');
var logger= require('../libs/logger')();

router.get('/', checkIsAdmin, function(req, res, next) {
  res.render('./admin/index');
});

router.get('/login', function(req, res, next) {
  res.render('./admin/login');
});

router.get('/logout', function(req, res, next) {
  req.session.user= '';
  res.redirect('/admin');
});

router.get('/login/verify', function(req, res, next) {
  if(req.query.username && req.query.password){
    usersModel.findOne({username: req.query.username}, function(resData){
      if(resData && resData.password=== req.query.password)
      {
        req.session.user= resData.username;
        res.send({
          status: 'success',
          resMsg: '登录成功！',
          resData: req.session.user
        }); 
        logger.info('Login successfully:', req.query.username);     
      }else{
        res.send({
          status: 'error',
          resMsg: '对不起，用户名或密码错误，请重试!'
        });        
      }
    })
  }else{
    res.send({
      status: 'error',
      resMsg: '对不起，用户名或密码错误，请重试!'
    });
  }
});

module.exports = router;