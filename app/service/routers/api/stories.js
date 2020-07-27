var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var eventProxy= require('../../libs/event-proxy').getEventProxy;
var logger= require('../../libs/logger')();
var userStorysModel= require('../../models/core')('UserStorys');
var groupsModel= require('../../models/core')('Groups');
var userStoryAuditsModel= require('../../models/core')('UserStoryAudits');
var sprintListsModel= require('../../models/core')('SprintLists');

router.get('/:objid', checkIsAdmin, function(req, res, next){
  var ep= eventProxy();
  var objid= req.params.objid;
  var module= req.query.module;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data fetch successfully！',
      resData: resData
    });
    return false;
  };
  if(objid){
    ep.all('stories', 'groups', function(stories, groups){
      res.send({
        status: 'success',
        resMsg: 'Data fetch successfully！',
        resData: stories,
        groups: groups
      });
      return false;      
    })
    userStorysModel.find({'sprint': objid}, function(resData){
      ep.emit('stories', resData);
    }, res);
    groupsModel.find({'module': module}, function(resData){
      ep.emit('groups', resData);
    }, res);
  }else{
    res.send({
      status: 'error',
      resMsg: 'Data fetch failed!'
    });
  }
});

router.post('/', checkIsAdmin, function(req, res, next) {
  var ep= eventProxy();
  var data= req.body;
  data.status = 'ADDED_AFTER_START';
  var sprintid= data.sprint;
  delete data.sprintid;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data create successfully！',
      resData: resData
    });
    return false;
  };
  ep.all('create', 'sprintinfo', function(resData, sprintinfo){
    userStorysModel.find({'sprint': sprintid}, handler, res);
    userStoryAuditsModel.create({
      storyid: resData._id,
      changereason: 'scope_change_add',
      changefield: '_id',
      databeforechange: '',
      dataafterchange: resData._id,
      changeinsprintday: getCurrentDays(sprintinfo)
    }, function() {
      logger.info('Add new story for sprint ', sprintid);
    }, res); 
  })
  userStorysModel.create(data, function(resData){
    ep.emit('create', resData);
  }, res);
  sprintListsModel.findOne({'_id': sprintid}, function(resData){
    ep.emit('sprintinfo', resData);
  })
});

router.put('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  var objid= data._id;
  delete data._id;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data update successfully！',
      resData: resData
    });
    return false;
  };
  userStorysModel.findOneAndUpdate({'_id': objid}, data, function(){
    userStorysModel.find({'sprint': data.sprint}, handler, res);
  }, res); 
});

router.delete('/', checkIsAdmin, function(req, res, next){
  var ep= eventProxy();
  var objid= req.query.objid;
  var sprintid= req.query.sprintid;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data delete successfully！',
      resData: resData
    });
    return false;
  };
  ep.all('delete', 'sprintinfo', function(deleteRes, sprintinfo){
    userStorysModel.find({'sprint': sprintid}, handler, res);
    userStoryAuditsModel.create({
      storyid: objid,
      changereason: 'scope_change_remove',
      changefield: '_id',
      databeforechange: objid,
      dataafterchange: '',
      changeinsprintday: getCurrentDays(sprintinfo)
    }, function() {
      logger.info('Remove story for sprint', sprintid);
    }, res);    
  })
  userStorysModel.remove({'_id': objid}, function(){
    ep.emit('delete', {});
  }, res);
  sprintListsModel.findOne({'_id': sprintid}, function(resData){
    ep.emit('sprintinfo', resData);
  })
});

function getCurrentDays(sprintinfo){
  var workdays= sprintinfo.workdays;
  var current= new Date().valueOf();
  var pastdays= 0;
  workdays.forEach(function(val, key, arr){
    if(new Date(val).valueOf()< current){
      pastdays++;
    }
  })
  return pastdays+1;
};

module.exports= router;