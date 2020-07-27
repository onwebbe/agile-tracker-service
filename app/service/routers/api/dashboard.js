var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var oModel= require('../../models/core')('SprintLists');
var userStorysModel= require('../../models/core')('UserStorys');
var userStoryAuditsModel= require('../../models/core')('UserStoryAudits');
var jiraFetch= require('../../libs/jira-fetch');
var logger= require('../../libs/logger')();
var worklogsModel= require('../../models/core')('Worklogs');
var jiraFetch= require('../../libs/jira-fetch');
var dashboardPrepare= require('../../libs/dashboard-prepare');
var async = require('async');
var config= require('config-lite')({
  config_basedir: __dirname
});
var userStoryDao= require('./dao/userStoryDao');
var userMapsModel= require('../../models/core')('UserMaps');
var groupsModel= require('../../models/core')('Groups');
var getEventProxy= require('../../libs/event-proxy').getEventProxy;

router.get('/', checkIsAdmin, function(req, res, next) {
  var ep= getEventProxy();
  this.sprintinfo = {};
  var that= this;
  var condition= {
    '_id': req.query.sprintid
  };
  var options= {
    'sortby': 'jiracreatedat',
    'order': '1'
  };
  ep.all('storylist', 'storyaudits', function(storylist, storyaudits){
    res.send({
      status: 'success',
      resMsg: 'Data fetch successfully!',
      resData: {'sprintData': this.sprintinfo,
                'totaldays': this.sprintinfo.workdays.length,
                'leftdays': this.sprintinfo.workdays? dashboardPrepare.getLeftDays(this.sprintinfo): 0,
                'inprogresspoints': dashboardPrepare.getInprogressPoints(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, dashboardPrepare.getCurrentDays(that.sprintinfo))) || 0,
                'inprogresstories': dashboardPrepare.getInprogressStories(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, dashboardPrepare.getCurrentDays(that.sprintinfo))) || [],
                'initialcommited': JSON.parse(JSON.stringify(storylist)).length>0? dashboardPrepare.getOnlyCommitedPoints(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, 1)) : 0,
                'initialcommitedstories': JSON.parse(JSON.stringify(storylist)).length>0? dashboardPrepare.getOnlyCommitedStories(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, 1)) : [],
                'commitedpoints': JSON.parse(JSON.stringify(storylist)).length>0? dashboardPrepare.getOnlyCommitedPoints(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, dashboardPrepare.getCurrentDays(that.sprintinfo))): 0,
                'commitedstories': JSON.parse(JSON.stringify(storylist)).length>0? dashboardPrepare.getOnlyCommitedStories(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, dashboardPrepare.getCurrentDays(that.sprintinfo))): [],
                'donepoints': JSON.parse(JSON.stringify(storylist)).length>0? dashboardPrepare.getDonePoints(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, dashboardPrepare.getCurrentDays(that.sprintinfo))): 0,
                'donestories': JSON.parse(JSON.stringify(storylist)).length>0? dashboardPrepare.getDoneStories(userStoryDao.getLastestStoryData(JSON.parse(JSON.stringify(storylist)), storyaudits, dashboardPrepare.getCurrentDays(that.sprintinfo))): []
              }
    });
    return false;
  });
  oModel.findOne(condition, function(resData){
    if(!resData){
      that.sprintinfo= {};
      ep.emit('storylist', []);
      ep.emit('storyaudits', []);
    }else{
      that.sprintinfo = resData;
      userStorysModel.find({'sprint': resData._id}, function(resData){
        ep.emit('storylist', resData);
      }, res, '', '', options);
      userStoryAuditsModel.find({'sprint': resData._id}, function(resData){
        ep.emit('storyaudits', resData);
      }, res, '', '', options);      
    }
  }, res, '', '', options);
});

router.get('/sprintHistoryPoints', checkIsAdmin, function(req, res, next) {
  var ep= getEventProxy();
  this.sprintinfo = {};
  var that= this;
  var condition= {
    'module': req.query.module
  };
  var options= {
    'sortby': 'jiracreatedat',
    'order': '1'
  };
  ep.all('latestsprint', 'lateststory', 'latestaudit', function(latestsprint, lateststory, latestaudit){
    var axisList= [];
    var plannedPoints= [];
    var donePoints= [];
    var commitedPoints = [];
    latestsprint.forEach(function(val, key, arr){
      axisList.push(val.key);
      plannedPoints.push((val.plannedpoints || 0));
      donePoints.push(dashboardPrepare.getDonePoints(userStoryDao.getLastestStoryData(getObjByField(lateststory, 'sprint', val._id), getObjByField(latestaudit, 'sprint', val._id), val.workdays.length)));
      commitedPoints.push(dashboardPrepare.getCommitedPoints(userStoryDao.getLastestStoryData(getObjByField(lateststory, 'sprint', val._id), getObjByField(latestaudit, 'sprint', val._id), val.workdays.length)));
    });
    res.send({
      status: 'success',
      resMsg: 'Data fetch successfully!',
      resData: { axis: axisList,
                 planned: plannedPoints,
                 done: donePoints,
                 commited: commitedPoints
                }
    });
    return false;
  });

  oModel.find({'status': 'done', 'module': req.query.module}, function(sprintlist){
    ep.emit('latestsprint', (sprintlist || []));
    async.map(sprintlist, function(item, callback){
      userStorysModel.find({'sprint': item._id}, function(resData){
        callback(null, {'sprint': item._id, 'resData': (resData || [])});
      }, res, '', '', options);
    }, function(err, results){
      ep.emit('lateststory', results);
    });
    async.map(sprintlist, function(item, callback){
      userStoryAuditsModel.find({'sprint': item._id}, function(resData){
        callback(null, {'sprint': item._id, 'resData': (resData || [])});
      }, res, '', '', options);      
    }, function(err, results){
      ep.emit('latestaudit', results);
    });    
  }, res, '', '', {
    'sortby': 'createdAt',
    'order': '1',
    'per_page': 8
  })
});

router.get('/worklog', checkIsAdmin, function(req, res, next) {
  var ep= getEventProxy();
  var condition= req.query || {};
  if(!condition.sprintid){
    logger.warn('No sprintid request for worklog!');
    res.send({
      status: 'success',
      resMsg: 'Data fetch successfully!',
      resData: [],
      usermap: {}
    });
    return false;    
  }
  if(condition.refresh === 'y'){
    ep.once('storySuccess', function(data) {
      logger.debug('Enter audit writting block!');
      writeAuditForStories(data, condition.sprintid, res, ep);
    });
    ep.once('storyEror', function(err) {
      logger.error('Requst story failed as', err);
      res.send({
        status: 'error',
        resMsg: 'Something wrong to get story data, please try again later!'
      });
      return false;
    });

    var usermaps= {};
    userMapsModel.find({module: condition.module}, function(resData){
      (resData || []).forEach(function(value, key, arr){
        usermaps[value.userid]= value.displayname;
      });
    }, res);
    async.waterfall([
      function(callback){
        oModel.findOne({status: 'inprogress', 'module': req.query.module}, function(resData){
          callback(null, resData);
        }, res);
      },
      function(sprintinfo, callback){
        if(sprintinfo.jql){
          jiraFetch.launchCall('worklog', {
            start: sprintinfo.start,
            end: sprintinfo.end,
            jql: sprintinfo.jql,
            expand: 'changelog',
            sprintid: sprintinfo._id,
            module: condition.module
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
          resMsg: 'Data fetch successfully!',
          resData: {data: result},
          usermap: config.usermap
        })        
      }
    });
  }else{
    ep.all('worklogs', 'usermaps', function(worklogs, usermaps){
      res.send({
        status: 'success',
        resMsg: 'Data fetch successfully!',
        resData: worklogs,
        usermap: usermaps
      });
      return false;      
    })
    worklogsModel.findOne({sprintid: condition.sprintid}, function(resData){
      ep.emit('worklogs', resData);
    }, res, '', '', {});
    userMapsModel.find({module: condition.module}, function(resData){
      var usermaps= {};
      (resData || []).forEach(function(value, key, arr){
        usermaps[value.userid]= value.displayname;
      });
      ep.emit('usermaps', usermaps);
    }, res);
  }
});

function writeAuditForStories(data, sprintid, res, ep){
  ep.all('userStoryInfoSuccessfully', 'sprintInfoSuccessfully', function(userStory, sprintInfo){
    ep.once('storyUpdateSuccessfully', function(){
      logger.debug('Start writting audit!');
      updateAudit(data, sprintid, res, ep);
    });
    compareStoriesStatus(data, userStory, sprintid, res, ep, sprintInfo);    
  });
  userStorysModel.find({sprint: sprintid}, function(resData){
    ep.emit('userStoryInfoSuccessfully', resData);
  }, res);
  oModel.findOne({'_id': sprintid}, function(resData){
    ep.emit('sprintInfoSuccessfully', resData);
  }, res)
};

function compareStoriesStatus(data, dbdata, sprintid, res, ep, sprintinfo){
  var addList= [];
  var modifyList= [];
  var dataHelperMap = {};
  var dbdataHelperMap = {};
  var moveBackList= {};
  logger.debug('Start update stories!');
  dbdata.forEach(function(val, key, arr){
    dbdataHelperMap[val.storykey] = val;
  });
  data.forEach(function(val, key, arr){
    dataHelperMap[val.key] = val;
    if(dbdataHelperMap[val.key] !== undefined){
      if(dbdataHelperMap[val.key].status === config.status.moveout){
        moveBackList[dbdataHelperMap[val.key].storykey]= true;
        dbdataHelperMap[val.key].status= config.status.movein;
        modifyList.push(dbdataHelperMap[val.key]);       
      }
    }else{
      addList.push({
        storykey:  val.key,
        name: val.fields.summary,
        issuetype: val.fields.issuetype && val.fields.issuetype.name,
        points: val.fields.customfield_10240 || val.fields.customfield_10402,
        status: config.status.movein,
        source: 'sys',
        summary: val.fields.summary,
        sprint: sprintid
      });
    }
  });
  dbdata.forEach(function(val, key, arr){
    var temDel= {};
    if(dataHelperMap[val.storykey] === undefined){
      temDel= val;
      temDel.status= config.status.moveout;
      modifyList.push(temDel);
    }
  });
  groupsModel.find({'module': data.module, 'isdefault': 'yes'}, function(groups){
    this.sprintgroups = [];
    groups.forEach(function(val, key, arr){
      this.sprintgroups.push(val._id);
    });
    ep.all('modify', 'added', function(modify, added){
      ep.emit('storyUpdateSuccessfully', '');
    });

    async.map(modifyList, function(data, callback){
      var tempObjId= data._id;
      delete data._id;
      userStorysModel.findOneAndUpdate({'_id': tempObjId}, data, function(){
        if(data.status == config.status.moveout){
          userStoryAuditsModel.create({
            storyid: data._id,
            changereason: 'scope_change_remove',
            changefield: '_id',
            databeforechange: data._id,
            dataafterchange: '',
            changeinsprintday: dashboardPrepare.getCurrentDays(sprintinfo),
            source: 'sys',
            sprint: sprintid      
          }, function(){
            callback(null, '');
          }, res);        
        }else if(moveBackList[data.storykey]){
          userStoryAuditsModel.create({
            storyid: data._id,
            changereason: 'scope_change_add',
            changefield: '_id',
            databeforechange: '',
            dataafterchange: data._id,
            changeinsprintday: dashboardPrepare.getCurrentDays(sprintinfo),
            source: 'sys',
            sprint: sprintid     
          }, function(){
            callback(null, '');
          }, res);  
        }else{
          callback(null, '');
        }
      }, res);
    }, function(err, results){
      if(err){
        logger.error('Story status update failed for updating:', err)
      }else{ 
        ep.emit('modify', '');
      }
    });
    async.map(addList, function(data, callback){
      data.sprintgroups= this.sprintgroups;
      userStorysModel.create(data, function(resData){
        userStoryAuditsModel.create({
          storyid: resData._id,
          changereason: 'scope_change_add',
          changefield: '_id',
          databeforechange: '',
          dataafterchange: resData._id,
          changeinsprintday: dashboardPrepare.getCurrentDays(sprintinfo),
          source: 'sys',
          sprint: sprintid       
        }, function(){
          callback(null, '');
        }, res);
      }, res);
    }, function(err, results){
      if(err){
        logger.error('Story status update failed for updating:', err)
      }else{
        ep.emit('added', '');
      }
    });
  }, res);

};

function updateAudit(data, sprintid, res, ep){
  var changeLogMap= {};
  var newAudit= [];
  (data || []).forEach(function(val, key, arr){
    changeLogMap[val.key] = val.changelog.histories || [];
  });
  // logger.debug('Change log map:', changeLogMap);
  ep.all('sprintinfo', 'storyList', function(sprintinfo, storyList){
    logger.debug('Start update audit!');
    userStoryAuditsModel.remove({sprint: sprintid, source: 'jira'}, function(resData){
      async.map(storyList, function(story, callback){
        changeLogMap[story.storykey].forEach(function(val, key, arr){
          if(val.items[0].field && (val.items[0].field.toLowerCase() == 'status') && (new Date(val.created).valueOf()<= (new Date(sprintinfo.end).valueOf()+3600*24*1000+1))){
            newAudit.push({
              storyid: story._id,
              changereason: 'Jira Activity',
              changefield: 'status',
              databeforechange: val.items[0]['fromString'],
              dataafterchange: val.items[0]['toString'],
              changeinsprintday: dashboardPrepare.getCurrentDays(sprintinfo, val.created),
              createdby: val.author.displayName,
              source: 'jira',
              jiracreatedat: val.created,
              sprint: sprintid            
            });
          }
        });
        callback(null, '');
      }, function(err, results){
        if(err){
          logger.error('Audit record failed!');
          res.send({
            status: 'error',
            resMsg: 'Data fetched failed!'
          });
          return false;
        }
        userStoryAuditsModel.create(newAudit, function(){
          logger.info('Audit record successfully!');
        }, res);
      });
    }, res);
  });
  oModel.findOne({'_id': sprintid}, function(resData){
    ep.emit('sprintinfo', resData);
  }, res);
  userStorysModel.find({'sprint': sprintid, status: {$ne: config.status.moveout}}, function(resData){
    ep.emit('storyList', resData);
  }, res);
};

function getObjByField(arr, fieldName, fieldValue){
  for(var idx=0; idx< arr.length; idx++){
    if(arr[idx][fieldName] == fieldValue){
      return arr[idx]['resData'];
    }    
  }
  return {};
}

module.exports = router;



