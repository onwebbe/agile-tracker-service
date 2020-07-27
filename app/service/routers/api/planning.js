var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var oModel= require('../../models/core')('SprintLists');
var getEventProxy= require('../../libs/event-proxy').getEventProxy;
var jiraFetch= require('../../libs/jira-fetch');
var logger= require('../../libs/logger')();
var worklogsModel= require('../../models/core')('Worklogs');
var jiraFetch= require('../../libs/jira-fetch');
var async = require('async');
var config= require('config-lite')({
  config_basedir: __dirname
});
var userStorysModel= require('../../models/core')('UserStorys');
var userMapsModel= require('../../models/core')('UserMaps');
var groupsModel= require('../../models/core')('Groups');

router.get('/', checkIsAdmin, function(req, res, next) {
  var that= this;
  var condition= {
    '_id': req.query.sprintid
  };
  var options= {
    'sortby': 'createdAt',
    'order': '-1'
  };
  var handler= function(resData){
    var totalPoints= 0;
    for(var idx=0; idx< resData.length; idx++){
      totalPoints += (resData[idx].points || 0);
    }
    res.send({
      status: 'success',
      resMsg: 'Data fetch successfully!',
      resData: that.sprintInfo,
      totalPoints: totalPoints
    });
    return false;
  };
  oModel.findOne(condition, function(resData){
    that.sprintInfo= resData;
    if(resData){
      userStorysModel.find({sprint: resData._id}, handler, res, '', '', options);
    }else{
      res.send({
        status: 'success',
        resMsg: 'Data fetch successfully!',
        resData: {},
        totalPoints: 0
      });
    }
  }, res, '', '', options);
});

router.get('/estimation', checkIsAdmin, function(req, res, next) {
  var ep= getEventProxy();
  var condition= req.query || {};
  if(!condition.sprintid){
    res.send({
      status: 'error',
      resMsg: 'Bad request!'
    });
    return false;    
  }
  if(condition.refresh === 'y'){
    var usernamemaps= {};
    var userinummaps= {};
    var capacitymaps= {};
    userMapsModel.find({module: condition.module}, function(resData){
      (resData || []).forEach(function(value, key, arr){
        usernamemaps[value.userid]= value.displayname;
        userinummaps[value.userid]= value.employeeid;
        capacitymaps[value.userid]= value.capacity;
      });
    }, res); 

    ep.once('storySuccess', function(data) {
      oModel.findOne({'_id': condition.sprintid}, function (sprintItem) {
        var allGroupIDS = sprintItem.sprintgroups;
        var storyArr= [];
        data.forEach(function(value, index, arr){
          storyArr.push({
            storykey:  value.key,
            name: value.fields.summary,
            issuetype: value.fields.issuetype && value.fields.issuetype.name,
            points: value.fields.customfield_10240 || value.fields.customfield_10402,
            status: config.status.initial,
            initialstatus: value.fields.status.name,
            summary: value.fields.summary,
            sprint: condition.sprintid,
            createdby: req.session.user,
            ingroup: allGroupIDS,
            assignee: (value.fields.assignee && value.fields.assignee.displayName) || (value.fields.assignee && value.fields.assignee.key) || 'Unassigned'
          });
        })
        userStorysModel.remove({sprint: condition.sprintid}, function(){
          userStorysModel.create(storyArr, function(){
            logger.info('Story data for sprint', condition.sprintid, 'updated successfully!');
          }, res);
        }, res);
      }, res);
    });
    ep.once('storyEror', function(err) {
      res.send({
        status: 'error',
        resMsg: 'Something wrong to get story data, please try again later!'
      });
      return false;
    });
    async.waterfall([
      function(callback){
        oModel.findOne({status: 'planning', module: req.query.module}, function(resData){
          callback(null, resData);
        }, res);
      },
      function(sprintinfo, callback){
        if(sprintinfo.jql){
          jiraFetch.launchCall('worklog', {
            start: sprintinfo.start,
            end: sprintinfo.end,
            jql: sprintinfo.jql,
            expand: '',
            sprintid: sprintinfo._id,
            module: req.query.module
          }, ep, callback);          
        }else{
          callback('Jql is required!');
        }
      },
      function(data, callback){
        worklogsModel.remove({sprintid: condition.sprintid}, function(){
          callback(null, data);
        }, res);
      },
      function(data, callback){
        worklogsModel.create({
          sprintid: condition.sprintid,
          data: data
        }, function(){
          callback(null, data);
        }, res);
      }
    ], function(err, result){
      if(err){
        res.send({
          status: 'error',
          resMsg: err
        });
      }else{
        res.send({
          status: 'success',
          resMsg: '数据获取成功！',
          resData: {'data': result},
          capacity: capacitymaps,
          usermap: usernamemaps,
          inummap: userinummaps,
          jql: sprintinfo.jql
        })
      }
    });
  }else{
    ep.all('worklogs', 'usermaps', 'sprintinfo', function(worklogs, usermaps, sprintinfo){
      res.send({
        status: 'success',
        resMsg: 'Data fetch successfully!',
        resData: worklogs,
        usermap: usermaps.namemap,
        capacity: usermaps.capacitymaps,
        inummap:usermaps.inummap,
        jql: sprintinfo.jql
      });
      return false;      
    });
    worklogsModel.findOne({sprintid: condition.sprintid}, function(resData){
      ep.emit('worklogs', resData);
    }, res, '', '', {});
    userMapsModel.find({module: condition.module}, function(resData){
      var usernamemaps= {};
      var userinummaps= {};
      var capacitymaps= {};
      (resData || []).forEach(function(value, key, arr){
        usernamemaps[value.userid]= value.displayname;
        userinummaps[value.userid]= value.employeeid;
        capacitymaps[value.userid]= value.capacity;
      });
      ep.emit('usermaps', {
        namemap: usernamemaps,
        inummap: userinummaps,
        capacitymaps: capacitymaps
      });
    }, res);
    oModel.findOne({status: 'planning', module: req.query.module}, function(resData){
      ep.emit('sprintinfo', resData);
    }, res);  
  }
});

module.exports = router;



