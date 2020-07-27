var express= require('express');
var router = express.Router();
// var checkIsAdmin= require('../middlewares/permission-check').checkIsAdmin;
// var usersModel= require('../models/core')('Users');
var logger= require('../libs/logger')();
var usersModel= require('../models/core')('Users');

// router.get('/logout', function(req, res, next) {
//   req.session.user= '';
//   res.redirect('/admin');
// });

// router.get('/login/verify', function(req, res, next) {
//   if(req.query.username && req.query.password){
//     usersModel.findOne({username: req.query.username}, function(resData){
//       if(resData && resData.password=== req.query.password)
//       {
//         req.session.user= resData.username;
//         res.send({
//           status: 'success',
//           resMsg: 'Verify successfully!',
//           resData: req.session.user
//         }); 
//         logger.info('Login successfully:', req.query.username);     
//       }else{
//         res.send({
//           status: 'error',
//           resMsg: 'Sorry, verify failed!'
//         });        
//       }
//     })
//   }else{
//     res.send({
//       status: 'error',
//       resMsg: 'Sorry, verify failed!'
//     });
//   }
// });

router.get('/login/verify', function(req, res, next) {
  if(req.query.username){
    req.session.username= req.query.username;
    req.session.module= req.query.module;
    res.send({
      status: 'success',
      resMsg: 'Verify successfully!',
      resData: req.session.user
    }); 
    usersModel.findOne({username: req.query.username}, function(resData){
      if(!resData){
        usersModel.create({
          username: req.query.username,
          permission: 0,
          role: 'visitor'
        }, function(){
          logger.info('New visitor added:', req.query.username);
        });
      }
    }, res);
    logger.info('Register successfully:', req.query.username); 
  }else{
    res.send({
      status: 'error',
      resMsg: 'Sorry, verify failed!'
    });
  }
});

module.exports = router;