const UserStorysTable = require('../../../models/core')('UserStorys');
const UserStoryAuditsTable = require('../../../models/core')('UserStoryAudits');
const eventProxy= require('../../../libs/event-proxy').getEventProxy();
const utils = require('./CommonUtils');
const logger = require('../../../libs/logger')();
const async = require('async');
//const USERSTORY_STATUS_NEW_ADD_STATUS = 'ADDED_AFTER_START';
const USERSTORY_STATUS_NEW_ADD_STATUS = 'XXXXXXXXXXXXXXX';

const UserStoryAudits = require('../../../libs/mongo')['UserStoryAudits'];

function getAllLatestStoryData(done, res, dateStr, sprintid) {
  // logger.info('UserStoryDao:getAllLatestStoryData:----------start---------');
  var sortOptions = {
    'sortby': 'changeinstoryday'
  }
  async.waterfall([
    function (innerdone) {
      UserStorysTable.find({'sprint': sprintid}, function(userstoryResData) {
        // logger.info('UserStoryDao:getAllLatestStoryData:queryUserStoryTable:recordCount:' + userstoryResData.length);
        innerdone(null, utils.clone(userstoryResData));
      }, res, {path: 'ingroup'}, '', sortOptions);
    },
    function (resultFromPrevious, innerdone) {
      var storyIDs = [];
      for (var i = 0; i < resultFromPrevious.length; i++) {
        var item = resultFromPrevious[i];
        var story_id = item['_id'];
        storyIDs.push(story_id);
      }
      // logger.info('UserStoryDao:getAllLatestStoryData:queryStoryAuditTable:storyids:' + storyIDs.join(','));
      /*UserStoryAuditsTable.find({'storyid': {'$in': storyIDs}}, function(userstoryauditResData) {
        logger.info('UserStoryDao:getAllLatestStoryData:queryStoryAuditTable:recordCount:' + userstoryauditResData.length);
        innerdone(null, [resultFromPrevious, utils.clone(userstoryauditResData)]);
      }, res, '', '', sortOptions);*/

      var sorts = {
        'changeinstoryday': 1,
        'jiracreatedat': 1
      }
      UserStoryAudits.find({'storyid': {'$in': storyIDs}})
        .populate('')
        .sort(sorts)
        .then(function(resData){
          // logger.info('UserStoryDao:getAllLatestStoryData:queryStoryAuditTable:recordCount:' + resData.length);
          innerdone(null, [resultFromPrevious, utils.clone(resData)]);
        })
        .catch(function(err){
          logger.error('Data query failed due to:[29]', err);          
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        });
    }
  ], function(err, results) {
    var stories = results[0];
    var storyaudits = results[1];
    //var latestStoryData = getLastestStoryData(utils.clone(stories), utils.clone(storyaudits), dateStr);
    var data = {
      allStorys: stories,
      allStoryAudits: storyaudits
      /*,
      latestStoryData: latestStoryData,*/
    }
    done(null, data);
  });
  // logger.info('UserStoryDao:getAllLatestStoryData:----------end---------');
};

function getLastestStoryData(storyList, storyAuditList, inputday) {
  // logger.info('UserStoryDao:getLastestStoryData:storyList size:' + storyList.length + '----------start---------');
  var storyDataList = [];
  for (var i = 0; i < storyList.length; i++) {
    var storyItem = storyList[i];
    var story_id = storyItem['_id'];
    var storyItemAuditList = utils.findAuditById(storyAuditList, story_id, 'storyid');
    // logger.info('UserStoryDao:getLastestStoryData:storyid:' + story_id + ':foundStoryAudit:recordCount:' + storyItemAuditList.length);
    var isAddStory = false;
    for (var j = 0; j < storyItemAuditList.length; j++) {
      var storyItemAuditItem = storyItemAuditList[j];
      var auditDay = storyItemAuditItem['changeinsprintday'];
      var field = storyItemAuditItem.changefield;
      var afterData = storyItemAuditItem.dataafterchange;
      if (field != '_id') {  // if field is _id then it could be add or remove
        if (inputday == null) {
          storyItem[field] = afterData;
        } else {
          if (inputday >= auditDay) {
            // logger.info('UserStoryDao:getLastestStoryData:storyid:' + story_id + ':changefield:' + field + ':fieldvalue-before:' + storyItem[field] + ':auditDay:' + auditDay);
            storyItem[field] = afterData;
            // logger.info('UserStoryDao:getLastestStoryData:storyid:' + story_id + ':changefield:' + field + ':fieldvalue-after:' + storyItem[field] + ':auditDay:' + auditDay);
          }
        }
        storyItem['jiracreatedat'] = new Date(storyItemAuditItem.jiracreatedat).valueOf();
        storyItem['updater'] = storyItemAuditItem.createdby;
      } else {
        if (inputday == null) {
          storyItem[field] = afterData;
        } else {
          if (inputday === auditDay) {
            var changereason = storyItemAuditItem.changereason;
            var source = storyItemAuditItem.source;
            // console.log('inputday:' + inputday + ':auditDay:' + auditDay + 'changereason:' + changereason + ':source:' + source);
            if (!isAddStory && changereason === 'scope_change_add' && source === 'sys') {
              isAddStory = true;
              // console.log('!!!!!!!!!!!!Added!!!!!!!!!!!!!!');
            }
          }
        }
      }
    }
    storyItem['AddStory'] = isAddStory;
    if (storyItem.status != USERSTORY_STATUS_NEW_ADD_STATUS) { // story with this status means that the story is not been added at this time
      storyDataList.push(storyItem);
    }
  }
  // logger.info('UserStoryDao:getLastestStoryData:storyDataList:' + storyDataList.length + '----------end---------');
  return storyDataList;
};

function getSprintTotalStoryPoint(done, res, sprintid) {
  UserStorysTable.find({'sprint': sprintid}, function(userstoryResData) {
    var totalPoint = {};
    for (var i = 0; i < userstoryResData.length; i++) {
      var userStoryItem = userstoryResData[i];
      var point = userStoryItem.points;
      var status = userStoryItem.status;
      var ingroup = userStoryItem.ingroup;
      
      for (var j = 0; j < ingroup.length; j++) {
        var groupItem = ingroup[j];
        var groupName = groupItem.groupname;
        var group_id = groupItem._id;
        if (totalPoint[groupName] == null) {
          totalPoint[groupName] = 0;
        }
        if (status != USERSTORY_STATUS_NEW_ADD_STATUS) {
          // console.log('groupname:' + groupName + ':point:' + totalPoint[groupName] + ':pointtoadd:' + point);
          totalPoint[groupName] += point;
        }
      }
    }
    done(null, totalPoint);
  }, res, {path: 'ingroup'}, '');
};
function getTodayStoryPoint(storyList, storyAuditList, allGroups, dateStr) {
  // logger.info('UserStoryDao:getTodayStoryPoint:storycount:' + storyList.length + ':storyAuditList count:' + storyAuditList.length + ':dateStr:' + dateStr);
  var totalPoint = null;
  var relatedAudit = getStoryAuditByDate(storyAuditList, dateStr);
  for (var i = 0; i < relatedAudit.length; i++) {
    var auditItem = relatedAudit[i];
    var auditField = auditItem.changefield;
    var auditAfterValue = auditItem.dataafterchange;
    var story_id = auditItem.storyid;
    if (auditField == 'status') {
      if (totalPoint == null) {
        totalPoint = {};
      }
      var relatedStory = getUserStoryById(storyList, story_id);
      var ingroups = relatedStory.ingroup;
      var points = relatedStory.points;
      if (ingroups == null || ingroups.length == 0) { //if no ingroup, will not add any
        totalPoint = null;
      } else {
        for (var j = 0; j < ingroups.length; j++) {
          var groupItem = ingroups[j];
          var groupName = groupItem.groupname;
          var groupRedStatusList = groupItem.grouppointstatus;
          if (totalPoint[groupName] == null) {
            totalPoint[groupName] = { 'add': 0, 'red': 0, 'addStorys': [], 'redStorys': []};
          }
          if (ifStoryReduce(auditItem, groupRedStatusList)) {
            totalPoint[groupName].red += points;
            totalPoint[groupName]['redStorys'].push(story_id);
          } else if (ifStoryAdd(auditItem, groupRedStatusList)) {
            totalPoint[groupName].add += points;
            totalPoint[groupName]['addStorys'].push(story_id);
          }
        }
      }
    }
  }
  if (totalPoint == null) {
    totalPoint = {};
    for (var j = 0; j < allGroups.length; j++) {
      var groupItem = allGroups[j];
      var groupName = groupItem.groupname;
      var groupRedStatusList = groupItem.grouppointstatus;
      if (totalPoint[groupName] == null) {
        totalPoint[groupName] = { 'add': 0, 'red': 0, 'addStorys': [], 'redStorys': []};
      }
    }
  }
  console.log(totalPoint);
  return totalPoint;
};
function ifStoryAdd(storyAudit, groupAddStatusList) {
  var isAdd = false;
  var beforeStatus = storyAudit.databeforechange;
  var afterStatus = storyAudit.dataafterchange;
  if ((beforeStatus == USERSTORY_STATUS_NEW_ADD_STATUS) && (afterStatus!=null && afterStatus!='')) {
    isAdd = true;
  }
  return isAdd;
}
function ifStoryReduce(storyAudit, groupRedStatusList) {
  var isReduce = false;
  var storyStatus = storyAudit.dataafterchange;
  for (var i = 0; i < groupRedStatusList.length; i++) {
    var groupRedItem = groupRedStatusList[i];
    if (storyStatus == groupRedItem) {
      isReduce = true;
      break;
    }
  }
  return isReduce;
}
function getUserStoryById(storyList, story_id) {
  var returnUserStory = null;
  for (var i = 0; i < storyList.length; i++) {
    var storyItem = storyList[i];
    var id = storyItem._id;
    if (id == story_id) {
      returnUserStory = storyItem;
      break;
    }
  }
  return returnUserStory;
}
function getStoryAuditByDate(storyAuditList, dateStr) {
  var returnAuditList = [];
  for (var i = 0; i < storyAuditList.length; i++) {
    var auditItem = storyAuditList[i];
    var day = auditItem.changeinsprintday;
    if (day == dateStr) {
      returnAuditList.push(auditItem);
    }
  }
  return returnAuditList;
}
function addNewStory(done, res, formData, status, dateStr) {
  async.waterfall([
    function (innerdone) {
      addStory(innerdone, res, formData);
    },
    function (resultFromPrevious, innerdone) {
      var userstoryid = resultFromPrevious._id;
      addStoryAudit(innerdone, res, userstoryid, dateStr, 'status', status, USERSTORY_STATUS_NEW_ADD_STATUS);
    }
  ], function(err, result) {
    createdObj = result;
    done(null, createdObj);
  });
}
function addStory(done, res, formData, status) {
  if (status == null) {
    status = USERSTORY_STATUS_NEW_ADD_STATUS;
  }
  formData.status = status;
  UserStorysTable.create(formData, function (createdObj) {
    done(null, createdObj);
  }, res);
}
function addStoryAudit(done, res, userstoryid, dateStr, field, aftervalue, beforevalue) {
  var dataToInsert = {
    storyid: userstoryid,
    changereason: 'Add new story audit',
    changefield: field,
    databeforechange: beforevalue,
    dataafterchange: aftervalue,
    changeinsprintday: dateStr
  }
  UserStoryAuditsTable.create(dataToInsert, function (createdObj) {
    done(null, createdObj);
  }, res);
}
function getValidUserStoryList (storyList) {
  var validStoryList = [];
  for (var i = 0; i < storyList.length; i++) {
    var storyItem = storyList[i];
    var storyStatus = storyItem.status;
    if (storyStatus !== USERSTORY_STATUS_NEW_ADD_STATUS) {
      validStoryList.push(storyItem);
    }
  }
}
function getTodayPoints (todayStoryList, group) {
  var redStoryList = [];
  var addStoryList = [];
  var currentPoint = 0;
  var returnGroup = {
    currentPoint: 0,
    groupid: group._id,
    points: {
      add: 0,
      red: 0,
      addtotal: 0,
      redtotal: 0,
      addStorys: [],
      redStorys: []
    }
  };
  var redStatuses = group.grouppointstatus;
  var addStatuses = group.groupworkingstatus;
  var totalPoints = 0;
  var pointToReduce = 0;
  for (let i = 0; i < todayStoryList.length; i++) {
    let storyItem = todayStoryList[i];
    let storyStatus = storyItem.status;
    let storyPoint = storyItem.points;
    totalPoints += storyPoint;
    if (utils.isStatusInStatusList(storyStatus, redStatuses)) {
      returnGroup.points.redtotal += storyPoint;
      returnGroup.points.redStorys.push(storyItem);
      pointToReduce += storyPoint;
    }
    if (utils.isStatusInStatusList(storyStatus, addStatuses)) {
      returnGroup.points.addtotal += storyPoint;
      returnGroup.points.addStorys.push(storyItem);
    }
  }
  // returnGroup.currentPoint = totalPoints - returnGroup.points.red + returnGroup.points.add;
  returnGroup.currentPoint = totalPoints - pointToReduce;

  return returnGroup;
}
module.exports = {
  getAllLatestStoryData: getAllLatestStoryData,
  getLastestStoryData: getLastestStoryData,
  getSprintTotalStoryPoint: getSprintTotalStoryPoint,
  getTodayStoryPoint: getTodayStoryPoint,
  addNewStory: addNewStory,
  getTodayPoints: getTodayPoints
};
