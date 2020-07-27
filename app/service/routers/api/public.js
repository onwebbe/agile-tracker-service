var express= require('express');
var router = express.Router();
var async = require('async');
var mongoose = require('mongoose');
const utils = require('./dao/CommonUtils');
var UserStoryDao = require('./dao/userStoryDao');
var StoryIssueDao = require('./dao/storyIssueDao');
var SprintDao = require('./dao/sprintDao');
var GroupDao = require('./dao/groupDao');
const logger = require('../../libs/logger')();
var moduleModel= require('../../models/core')('Modules');
var prepareTools= require('../../libs/dashboard-prepare');

router.get('/modules', function(req, res, next){
  moduleModel.find({}, function(list){
    res.send({
      status: 'success',
      resData: list
    });
  }, res);
});

router.get('/sprints', function(req, res, next){
  var module = req.query.module;
  async.parallel([
    function (done) {
      SprintDao.getAllSprint(done, res, module);
    },
    function (done) {
      moduleModel.find({}, function(resData){
        done(null, resData);
      }, res);
    }
  ], function(err, response, total){
    var allSprintList = response[0];
    res.send({
      status: 'success',
      resMsg: 'Get Data Success',
      resData: allSprintList,
      moduleList: response[1]
    });
  });
});
router.get('/getGroups', function(req, res, next){
  var sprintid = req.query['sprintid'];
  var callback = function (err, sprint) {
    var groups = sprint.sprintgroups;
    res.send({
      status: 'success',
      resMsg: 'Get Data Success',
      resData: groups
    });
  }
  SprintDao.getSprintById(callback, res, sprintid);
});
router.post('/updateIssue', function(req, res, next){
  var formData = req.body;
  var sprintid = formData.sprintid;
  var issueid = formData.issueid; // The Object id for the issue
  var changereason = formData.changereason; // reason of the change
  var changefield = formData.changefield; // field name
  var dataafterchange = formData.dataafterchange;
  var changeinsprintday = formData.changeinsprintday; // 10
  // console.log(issueid + ':' + changeinsprintday + ':' + changefield + ':' + dataafterchange);
  if (sprintid == null || sprintid == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! sprintid is mandatory',
      resData: {}
    });
    return false;
  }
  if (issueid == null || issueid == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! issueid is mandatory',
      resData: {}
    });
    return false;
  }
  if (changefield == null || changefield == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! changefield is mandatory',
      resData: {}
    });
    return false;
  }
  if (dataafterchange == null || dataafterchange == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! dataafterchange is mandatory',
      resData: {}
    });
    return false;
  }
  if (changeinsprintday == null || changeinsprintday == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! changeinsprintday is mandatory',
      resData: {}
    });
    return false;
  }
  async.waterfall([
    function (innerdone) {
      StoryIssueDao.getAllStoryIssues(innerdone, res, null, sprintid);
    },
    function (resultFromPrevious, innerdone) {
      var allIssueData = resultFromPrevious.allStoryIssues;
      var allIssueAuditData = resultFromPrevious.allStoryIssueAudits;
      var fieldBeforeValue = '';
      var todayIssues = StoryIssueDao.getLastestStoryIssueData(utils.clone(allIssueData), utils.clone(allIssueAuditData), changeinsprintday);
      var todayBlockers = todayIssues.block;
      if (todayBlockers === null || todayBlockers === undefined) {
        todayBlockers = [];
      }
      if (todayFollowups === null || todayFollowups === undefined) {
        todayFollowups = [];
      }
      var todayFollowups = todayIssues.followup;
      var allIssueList = todayBlockers.concat(todayFollowups);
      for (var i = 0; i < allIssueList.length; i++) {
        var todayIssueItem = allIssueList[i];
        if (todayIssueItem !== undefined && todayIssueItem !== null) {
          if (todayIssueItem['_id'] === issueid) {
            fieldBeforeValue = todayIssueItem[changefield];
            break;
          }
        }
      }
      // console.log(issueid + ':' + changeinsprintday + ':' + changefield + ':' + dataafterchange + ':' + fieldBeforeValue);
      StoryIssueDao.updateStoryIssue(innerdone, res, issueid, changeinsprintday, changefield, dataafterchange, fieldBeforeValue);
    },
    function (err, results) {
      var createdObj = results;
      res.send({
        status: 'success',
        resMsg: 'story updated successful',
        resData: {}
      });
    }
  ]);
});
router.post('/addIssue', function(req, res, next){
  var formData = req.body;
  var issuekey = formData.issuekey; // CDP-3293
  var storyid = formData.storyid; // CDP-3293
  var issuename = formData.name; // Add audit infomration for GDPR
  var follower = formData.follower; // 10
  var issuegroup = formData.issuegroup; 
  var category = formData.category; // block/followup
  var sprint = formData.sprint; // in sprint
  var comments = formData.comments; // in sprint
  var changeinsprintday = formData.changeinsprintday;
  var status = formData.status;
  if (sprint == null || sprint == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! sprint is mandatory',
      resData: {}
    });
    return false;
  }
  if (changeinsprintday == null || changeinsprintday == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! changeinsprintday is mandatory',
      resData: {}
    });
    return false;
  }
  if (category == null || category == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! category is mandatory for example block or followup',
      resData: {}
    });
    return false;
  }
  if (issuekey == null || issuekey == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! issuekey is mandatory for example CDP-3912',
      resData: {}
    });
    return false;
  }
  if (storyid == null || storyid == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! storyid is mandatory.',
      resData: {}
    });
    return false;
  }
  var done = function (err, data) {
    res.send({
      status: 'success',
      resMsg: 'New story added successful',
      resData: data
    });
  }
  StoryIssueDao.addNewStoryIssue(done, res, utils.clone(formData), status, changeinsprintday);
});
router.post('/addStory', function(req, res, next){
  var formData = req.body;
  var storyKey = formData.storykey; // CDP-3293
  var storyname = formData.storyname; // Add audit infomration for GDPR
  var storyPoints = formData.storypoints; // 10
  var issueType = formData.issuetype; // block/followup
  var summary = formData.summary; // detail information
  var sprint = formData.sprint; // in sprint
  var ingroup = formData.ingoup;  // groupid
  var changeinsprintday = formData.changeinsprintday;
  var status = formData.status;
  if (sprint == null || sprint == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! sprint is mandatory',
      resData: {}
    });
    return false;
  }
  if (changeinsprintday == null || changeinsprintday == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! changeinsprintday is mandatory',
      resData: {}
    });
    return false;
  }
  if (issueType == null || issueType == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! issuetype is mandatory for example block or followup',
      resData: {}
    });
    return false;
  }
  if (storyKey == null || storyKey == '') {
    res.send({
      status: 'failed',
      resMsg: 'Error! storykey is mandatory for example CDP-3912',
      resData: {}
    });
    return false;
  }
  var done = function (err, data) {
    res.send({
      status: 'success',
      resMsg: 'New story added successful',
      resData: data
    });
  }
    
});

router.get('/summary', function(req, res, next){
  //var sprintid = '5a54863a5170323f38f3432d';
  var sprintid = req.query.sprintid;
  var module = req.query.module;
  if (sprintid == null) {
    res.send({
      status: 'failed',
      resMsg: 'No sprint id',
      resData: {}
    });
    return false;
  }
  // logger.info('public:summary:----------start---------');
  async.parallel([
    function (done) {
      SprintDao.getSprintList(done, res, sprintid);
    },
    function (done) {
      UserStoryDao.getAllLatestStoryData(done, res, null, sprintid);
    },
    function (done) {
      StoryIssueDao.getAllStoryIssues(done, res, null, sprintid);
    },
    function (done) {
      UserStoryDao.getSprintTotalStoryPoint(done, res, sprintid);
    },
    function (done) {
      GroupDao.getAllGroups(done, res, sprintid);
    },
    function (done) {
      SprintDao.getWorkLog(done, res, null, sprintid);
    },
    function (done) {
      SprintDao.getCapacity(done, res, module);
    }
  ], function(err, response, total){
    var daysList = response[0][0];
    var totalDays = response[0][1];
    var sprintGroups = response[0][2];
    var storyData = response[1];
    var allStoryData = storyData.allStorys;
    var allStoryAuditData = storyData.allStoryAudits;
    /*console.log('--------------++++++++++++++++++-----------------');
    console.log(allStoryData);
    console.log('--------------++++++++++++++++++-----------------');
    console.log(allStoryAuditData);
    console.log('--------------++++++++++++++++++-----------------');*/

    var issueData = response[2];
    var allIssueData = issueData.allStoryIssues;
    var allIssueAuditData = issueData.allStoryIssueAudits;

    var totalPointInfo = response[3];
    var allGroups = response[4];
    var resultData = [];
    // var allComposedItem = UserStoryDao.getLastestStoryData(utils.clone(allStoryData), utils.clone(allStoryAuditData));
    // var allComposedItem = UserStoryDao.getTodayStoryPoint(allStoryData, allStoryAuditData, allGroups, 3);
    /* var currentPoint = {};
    for (let i = 0; i < allGroups.length; i++) {
      var groupItem = allGroups[i];
      var groupName = groupItem.groupname;
      currentPoint[groupName] = totalPointInfo[groupName];
    }*/
    resultData.push({});
    for (let i = 0; i < daysList.length; i++) {
      // logger.info('public:summary:----------start day---------' + i);
      var dayItem = daysList[i];
      var dayComposeItem = {
        day: dayItem.day,
        date: dayItem.date,
        groups: dayItem.groups
      };
      // user story points by group
      // solution 1 to calculate user story point
      /* var storyPoint = UserStoryDao.getTodayStoryPoint(allStoryData, allStoryAuditData, allGroups, dayItem.day);
      for ( groupname in dayComposeItem.groups) {
        if (dayComposeItem['groups'][groupname] == null) {
          dayComposeItem['groups'][groupname] = {};
        }
        dayComposeItem['groups'][groupname].points = storyPoint[groupname];
        var redPoint = storyPoint[groupname].red;
        var addPoint = storyPoint[groupname].add;
        currentPoint[groupname] += addPoint;
        currentPoint[groupname] -= redPoint;

        dayComposeItem['groups'][groupname]['currentPoint'] = currentPoint[groupname];
      }*/
      // solution 2 to calculate user story point
      var todayStory = UserStoryDao.getLastestStoryData(utils.clone(allStoryData), utils.clone(allStoryAuditData), dayItem.day);
      dayComposeItem.storyList = todayStory;
      for (let i = 0; i < sprintGroups.length; i++) {
        var groupItem = sprintGroups[i];
        var groupName = groupItem.groupname;
        if (dayComposeItem['groups'][groupName] == null) {
          dayComposeItem['groups'][groupName] = {};
        }
        let groupStoryInfo = null;
        var todayGroupStory = utils.getStoryByGroup(todayStory, groupName);
        groupStoryInfo = UserStoryDao.getTodayPoints(todayGroupStory, groupItem);
        logger.debug('----------------------day:' + dayItem.day + '-------groupName:' + groupName + '---------------');
        if (dayItem.day > 1) {
          var previousDayPoint = resultData[dayItem.day - 1].groups[groupName].currentPoint;
          groupStoryInfo.points.red = Math.abs(groupStoryInfo.currentPoint - previousDayPoint);
        }
        dayComposeItem['groups'][groupName] = groupStoryInfo;
        
      }
      // get current date blockers
      var todayIssues = StoryIssueDao.getLastestStoryIssueData(utils.clone(allIssueData), utils.clone(allIssueAuditData), dayItem.day);

      var todayBlockers = todayIssues.block;
      var todayFollowups = todayIssues.followup;

      if (todayBlockers) {
        for (var j = 0; j < todayBlockers.length; j++) {
          var issueItem = todayBlockers[j];
          var issuegroup = issueItem.issuegroup;
          for (var k = 0; k < issuegroup.length; k++) {
            var issuegroupItem = issuegroup[k];
            var groupname = issuegroupItem.groupname;
            if (dayComposeItem['groups'][groupname] == null) {
              dayComposeItem['groups'][groupname] = {};
            }
            if (dayComposeItem['groups'][groupname]['blocker'] == null) {
              dayComposeItem['groups'][groupname]['blocker'] = [];
            }
            dayComposeItem['groups'][groupname]['blocker'].push(issueItem);
          }
        }
      }
      if (todayFollowups) {
        for (var j = 0; j < todayFollowups.length; j++) {
          var issueItem = todayFollowups[j];
          var issuegroup = issueItem.issuegroup;
          for (var k = 0; k < issuegroup.length; k++) {
            var issuegroupItem = issuegroup[k];
            var groupname = issuegroupItem.groupname;
            if (dayComposeItem['groups'][groupname] == null) {
              dayComposeItem['groups'][groupname] = {};
            }
            if (dayComposeItem['groups'][groupname]['followup'] == null) {
              dayComposeItem['groups'][groupname]['followup'] = [];
            }
            dayComposeItem['groups'][groupname]['followup'].push(issueItem);
          }
        }
      } else {

      }
      if (i === 0) {
        resultData[0] = JSON.parse(JSON.stringify(dayComposeItem));
        resultData[0].day = 0;
      }
      resultData.push(dayComposeItem);
    }

    for (let i = 0; i < sprintGroups.length; i++) {
      let spGroup = sprintGroups[i];
      let spGroupName = spGroup.groupname;
      if (totalPointInfo[spGroupName] == null) {
        totalPointInfo[spGroupName] = 0;
      }
    }
    var allComposedItem = {
      'initialPoints': totalPointInfo,
      'summary': resultData,
      'storyList': UserStoryDao.getLastestStoryData(utils.clone(allStoryData), utils.clone(allStoryAuditData)),
      'constances': {
        storyIssueResovledStatus: StoryIssueDao.USERSTORYISSUE_RESOVED_STATUS
      },
      'effortOffsetRatio': getEffortRatio(daysList, parseInt(response[5]), parseInt(response[6])),
      'sprintTotalDayCount': totalDays
    }
    res.send({
      status: 'success',
      resMsg: 'Get Data Success',
      resData: allComposedItem
    });
  })
});

router.put('/blockers', function(req, res, next){

});

function getEffortRatio (daysList, loggedEffort, capacity) {
  if(!loggedEffort || !capacity){
    return 0;
  }
  var days = [];
  daysList.forEach (function(val, index, arr) {
    days.push(val.date);
  })
  var currentDay = prepareTools.getCurrentDays({workdays: days});
  if(currentDay >= days.length){
    return 0;
  }
  var expectedEfforts = currentDay > 1? Math.round((currentDay)*capacity*3600/daysList.length) : 0;
  var offsetRatio = Math.floor(Math.abs(loggedEffort - expectedEfforts)/expectedEfforts*100)/100;
  return offsetRatio || 0;
}


module.exports = router;