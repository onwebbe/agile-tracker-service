var express= require('express');
var router = express.Router();
var checkIsSuperAdmin= require('../../middlewares/permission-check').checkIsSuperAdmin;
var moduleModel= require('../../models/core')('Modules');
var userModel= require('../../models/core')('Users');
var groupModel= require('../../models/core')('Groups');
var getEventProxy= require('../../libs/event-proxy').getEventProxy;
var logger= require('../../libs/logger')();
var async = require('async');
var config= require('config-lite')({
  config_basedir: __dirname
});

router.get('/', checkIsSuperAdmin, function(req, res, next) {
  var ep= getEventProxy();
  var data= req.query;
  if(!data.modulekey  || !data.username || !data.pwd){
    res.send({
      status: 'error',
      resMsg: 'Bad request paramters!'
    });
    return false;
  }
  ep.all('module', 'user', 'groups', function(){
    res.send('Module created successfully!');
    logger.info('module [', data.modulekey, '] created successfully!');
  });
  moduleModel.create({
    key: data.modulekey,
    displayname: data.displayname,
    createdby: req.session.username,
    token: data.token
  }, function(){
    ep.emit('module');
  }, res);
  if(data.admin){
    async.map((data.admin.split(',')), function(user, callback){
      userModel.findOne({username: user}, function(resData){
        if(resData){
          var tempModules= [];
          for(var idx=0; idx< resData.modules.length; idx++){
            tempModules.push(resData.modules[idx]);
          }
          tempModules.push(data.modulekey);
          userModel.findOneAndUpdate({
            username: user
          }, {
            modules: tempModules
          }, function(){
            callback(null, '');
          }, res);
        }else{
          userModel.create({
            username: user,
            permission: 2,
            role: 'admin',
            modules: [data.modulekey]
          }, function(){
            callback(null, '');
          }, res);        
        }
      }, res);    
    }, function(err, results){
      if(err){
        logger.error('Module create failed since:', err);
        res.send({
          status: 'error',
          resMsg: 'Bad request paramters!'
        });
        return false;
      }
      ep.emit('user');
    });
  }else{
    ep.emit('user');
  }
  groupModel.create([{
    groupname: 'Commited',
    description: 'For dev',
    module: data.modulekey,
    category: 'Default',
    grouppointstatus: config.status.commited,  
    isdefault: 'yes'
  },
  {
    groupname: 'Done',
    description: 'For QA',
    module: data.modulekey,
    grouppointstatus: config.status.done,  
    isdefault: 'yes'
  }], function(){
    ep.emit('groups');
  }, res);

});

module.exports = router;