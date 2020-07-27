const StoryIssuesTable = require('../../../models/core')('StoryIssues');
const StoryIssueAuditsTable = require('../../../models/core')('StoryIssueAudits');
const eventProxy= require('../../../libs/event-proxy').getEventProxy();
const utils = require('./CommonUtils');
const logger = require('../../../libs/logger')();
var async = require('async');
const USERSTORY_STATUS_NEW_ADD_STATUS = 'ADDED_AFTER_START';
const USERSTORYISSUE_RESOVED_STATUS = 'Resolved';
const StoryIssueAudits = require('../../../libs/mongo')['StoryIssueAudits'];

function getAllStoryIssues(done, res, dateStr, sprintid) {
  // logger.info('StoryIssueDao:getAllStoryIssues:----------start---------');
  var sortOptions = {
    'sortby': 'changeinstoryday',
    'order': 1
  }
  // console.log('getAllStoryIssues sprintid:' + sprintid);
  async.waterfall([
    function (innerdone) {
      StoryIssuesTable.find({'sprint': sprintid}, function(resData) {
        // logger.info('StoryIssueDao:getAllStoryIssues:get sprint issues:sprint:' + sprintid + ':issue count:' + resData.length);
        innerdone(null, utils.clone(resData));
      }, res, {path:'issuegroup'}, '');
    },
    function (resultFromPrevious, innerdone) {
      var storyIssueIDs = [];
      for (var i = 0; i < resultFromPrevious.length; i++) {
        var item = resultFromPrevious[i];
        var issue_id = item['_id'];
        storyIssueIDs.push(issue_id);
      }

      var sorts = {
        'changeinstoryday': 1,
        'lastMod': 1
      }
      StoryIssueAudits.find({'issueid': {'$in': storyIssueIDs}})
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

    var storyIssueList = results[0];
    var storyIssueAuditList = results[1];
    //var latestStoryIssueData = getLastestStoryIssueData(utils.clone(storyIssueList), utils.clone(storyIssueAuditList), dateStr);
    var data = {
      allStoryIssues: storyIssueList,
      allStoryIssueAudits: storyIssueAuditList
      /*,
      latestStoryIssueData: latestStoryIssueData,*/
    }
    done(null, data);
  });
};

function getLastestStoryIssueData(storyIssueList, storyIssueAuditList, inputday) {
  var storyIssueDataList = {};
  for (var i = 0; i < storyIssueList.length; i++) {
    var storyIssueItem = storyIssueList[i];
    var storyIssue_id = storyIssueItem['_id'];
    var storyIssueKey = storyIssueItem['issuekey'];
    var storyIssueCategory = storyIssueItem['category'];
    var storyIssueItemAuditList = utils.findAuditById(storyIssueAuditList, storyIssue_id, 'issueid');
    // console.log('getLastestStoryIssueData:find audit list:' + storyIssue_id);
    // console.log(storyIssueAuditList);
    for (var j = 0; j < storyIssueItemAuditList.length; j++) {
      var storyIssueItemAuditItem = storyIssueItemAuditList[j];
      var auditDay = storyIssueItemAuditItem['changeinsprintday'];
      var field = storyIssueItemAuditItem.changefield;
      var afterData = storyIssueItemAuditItem.dataafterchange;
      if (inputday == null) {
        storyIssueItem[field] = afterData;
      } else {
        if (inputday >= auditDay) {
          // console.log('----------------xxxxxxxxx---------------input:' + inputday + ':audit:' + auditDay);
          // console.log('id:' + storyIssueItemAuditItem.issueid + ':before:' + storyIssueItem[field]);
          storyIssueItem[field] = afterData;
          // console.log('id:' + storyIssueItemAuditItem.issueid + ':after:' + storyIssueItem[field]);
        }
      }
    }
    storyIssueCategory = storyIssueItem['category'];
    if (storyIssueDataList[storyIssueCategory] === null || typeof storyIssueDataList[storyIssueCategory] === 'undefined') {
      storyIssueDataList[storyIssueCategory] = [];
    }

    // if issue is newly added, will not calculate
    if (storyIssueItem.status != USERSTORY_STATUS_NEW_ADD_STATUS) {
      storyIssueDataList[storyIssueCategory].push(storyIssueItem);
    }
  }
  return storyIssueDataList;
};
function addNewStoryIssue(done, res, formData, status, dateStr) {
  async.waterfall([
    function (innerdone) {
      addStoryIssue(innerdone, res, formData);
    },
    function (resultFromPrevious, innerdone) {
      var storyissueid = resultFromPrevious._id;
      addStoryIssueAudit(innerdone, res, storyissueid, dateStr, 'status', status, USERSTORY_STATUS_NEW_ADD_STATUS);
    }
  ], function(err, result) {
    createdObj = result;
    done(null, createdObj);
  });
}
function addStoryIssue(done, res, formData, status) {
  if (status == null) {
    status = USERSTORY_STATUS_NEW_ADD_STATUS;
  }
  formData.status = status;
  StoryIssuesTable.create(formData, function (createdObj) {
    done(null, createdObj);
  }, res);
}
function addStoryIssueAudit(done, res, storyissueid, dateStr, field, aftervalue, beforevalue) {
  var dataToInsert = {
    issueid: storyissueid,
    changereason: 'Add new story issue audit',
    changefield: field,
    databeforechange: beforevalue,
    dataafterchange: aftervalue,
    changeinsprintday: dateStr
  }
  StoryIssueAuditsTable.create(dataToInsert, function (createdObj) {
    done(null, createdObj);
  }, res);
}
module.exports = {
  getAllStoryIssues: getAllStoryIssues,
  getLastestStoryIssueData: getLastestStoryIssueData,
  addNewStoryIssue: addNewStoryIssue,
  USERSTORYISSUE_RESOVED_STATUS: USERSTORYISSUE_RESOVED_STATUS,
  updateStoryIssue: addStoryIssueAudit
};
