var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var oModel= require('../../models/core')('SprintLists');
var getEventProxy= require('../../libs/event-proxy').getEventProxy;
var jiraFetch= require('../../libs/jira-fetch');
var logger= require('../../libs/logger')();
var userStorysModel= require('../../models/core')('UserStorys');
var sprintDaysModel= require('../../models/core')('SprintDays');
var groupsModel= require('../../models/core')('Groups');
var async = require('async');
var config= require('config-lite')({
  config_basedir: __dirname
});
var resultHandler= require('../../libs/result-handler');

router.post('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  data.key= data.module+'/'+data.release+'/'+data.sprint;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data create successfully!',
      resData: resData
    });
    return false;
  };

  oModel.find({'module': data.module, 'status': 'planning'}, function(resData){
    if (resData && resData.length > 0) {
      res.send({
        status: 'error',
        resMsg: 'Sorry, planning and inprogress status sprint should be unique!'
      });
    } else {
      groupsModel.find({'module': data.module, 'isdefault': 'yes'}, function(groups){
        data.sprintgroups = [];
        groups.forEach(function(val, key, arr){
          data.sprintgroups.push(val._id);
        });
        oModel.create(data, function(data) {
          var sprintid = data._id;
          var sprintDatesData = [];
          for (var idx = 0; idx < data.workdays.length; idx++ ){
            sprintDatesData.push({
              sprintid: sprintid,
              sprintdate: data.workdays[idx]
            });
          }
          sprintDaysModel.remove( {sprintid: sprintid}, function() {
            sprintDaysModel.create(sprintDatesData, function() {
              oModel.find({'module': data.module}, handler, res);
              }, res);
          }, res);
        }, res);  
      }, res); 
    }
  }, res);
});

router.put('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  var objid= data._id;
  var sprintDatesData = [];
  for(var idx = 0; idx < data.workdays.length; idx++ ){
    sprintDatesData.push({
      sprintid: objid,
      sprintdate: data.workdays[idx]
    });
  }
  delete data._id;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data update successfully!',
      resData: resData
    });
    return false;
  };
  oModel.findOneAndUpdate({'_id': objid}, data, function(){
    oModel.find({'module': data.module}, handler, res);
  }, res);
  sprintDaysModel.remove({sprintid: objid}, function(){
    sprintDaysModel.create(sprintDatesData, function(){}, res);
  }, res);
});

router.put('/proceed', checkIsAdmin, function(req, res, next) {
  var ep= getEventProxy();
  var module= req.query.module;
  var sprintid= req.query.sprintid;
  if(sprintid){
    ep.all('current', 'inprogress', 'planning', function(current, inprogress, planning){
      if(current.status == 'done'){
        if(planning && planning.length > 0){
          res.send({
            status: 'error',
            resMsg: 'Sorry, planning and inprogress status sprint should be unique!'
          });
        }else{
          oModel.findOneAndUpdate({'_id': sprintid}, {status: 'planning'}, function(){
            res.send({
              status: 'success',
              resMsg: 'Proceed successfully!'
            });
          }, res); 
        }
      }else if(current.status == 'planning'){
        if(inprogress && inprogress.length > 0){
          res.send({
            status: 'error',
            resMsg: 'Sorry, planning and inprogress status sprint should be unique!'
          });
        }else{
          userStorysModel.find({'sprint': sprintid}, function(resData){
            var totalpoints= 0;
            resData.forEach(function(val, key, arr){
              totalpoints += (parseInt(val.points) || 0);
            });
            oModel.findOneAndUpdate({'_id': sprintid}, {status: 'inprogress', plannedpoints: (totalpoints || 0)}, function(){
              res.send({
                status: 'success',
                resMsg: 'Proceed successfully!'
              });
            }, res);
          }, res);
        }
      }else if(current.status == 'inprogress'){
        oModel.findOneAndUpdate({'_id': sprintid}, {status: 'done'}, function(){
          res.send({
            status: 'success',
            resMsg: 'Proceed successfully!'
          });
        }, res); 
      }else{
        res.send({
          status: 'error',
          resMsg: 'Proceed failed!'
        });        
      }
    });
    oModel.find({'status': 'inprogress', 'module': module}, function(resData){
      ep.emit('inprogress', resData);
    });
    oModel.find({'status': 'planning', 'module': module}, function(resData){
      ep.emit('planning', resData);
    });
    oModel.findOne({'_id': sprintid}, function(resData){
      ep.emit('current', resData);
    });
  }else{
    if(status == 'planning'){
      oModel.find({'status': 'inprogress', 'module': module}, function(resData){
        if(resData && resData.length == 0){
          async.waterfall([
            function(callback){
              oModel.findOne({'status': 'planning', 'module': module}, function(resData){
                callback(null, resData);
              })
            },
            function(sprintinfo, callback){
              if(sprintinfo){
                userStorysModel.find({'sprint': sprintinfo._id}, function(resData){
                  var totalpoints= 0;
                  resData.forEach(function(val, key, arr){
                    totalpoints += (parseInt(val.points) || 0);
                  });
                  callback(null, (totalpoints || 0));
                })                
              }else{
                res.send({
                  status: 'error',
                  resMsg: 'Proceed failed!'
                });
                callback('bad request');
              }
            }
          ], function(err, results){
            oModel.findOneAndUpdate({'status': 'planning', 'module': module}, {status: 'inprogress', 'plannedpoints': results}, function(){
              res.send({
                status: 'success',
                resMsg: 'Proceed successfully!'
              });
            }, res); 
          });
        }else{
          res.send({
            status: 'error',
            resMsg: 'Sorry, planning and inprogress status sprint should be unique!'
          });
        }
      }, res);
    }else if(status == 'inprogress'){
      oModel.findOneAndUpdate({'status': 'inprogress', 'module': module}, {status: 'done'}, function(){
        res.send({
          status: 'success',
          resMsg: 'Proceed successfully!'
        });
      }, res);
    }else{
      res.send({
        status: 'error',
        resMsg: 'Proceed failed!'
      });
    }      
  }

});

router.get('/', checkIsAdmin, function(req, res, next) {
  var condition= {
    module: req.query.module
  };
  var options= {
    'sortby': 'createdAt',
    'order': '-1',
    'page': 1,
    'per_page': parseInt(req.query.limit) || 10
  };
  if(req.query.sprintid){
    var handler= function(resData){
      resultHandler.responseInfo('REQUEST_SUCCESS', res, {
        sprintinfo: resData,
        defaultJql: config.default.jql        
      });
      return false;
    };
    oModel.findOne({'_id': req.query.sprintid}, handler, res);
  }else{
    async.parallel([function(callback){
      oModel.find({module: req.query.module, status: 'planning'}, function(resData){
        callback(null, resData);
      }, res);
    },function(callback){
      oModel.find({module: req.query.module, status: 'inprogress'}, function(resData){
        callback(null, resData);
      }, res);
    },function(callback){
      oModel.find({module: req.query.module}, function(resData){
        callback(null, resData);
      }, res, '', '', options);    
    }], function(err, results){
      if(err){
        resultHandler.responseInfo('INTERNAL_ERROR', res, err);
        return false;
      }
      resultHandler.responseInfo('REQUEST_SUCCESS', res, results);
    })    
  }
});

module.exports = router;



