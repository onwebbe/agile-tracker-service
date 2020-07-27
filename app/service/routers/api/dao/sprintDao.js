const eventProxy= require('../../../libs/event-proxy').getEventProxy();
const SprintListTable = require('../../../models/core')('SprintLists');
const SprintDaysTable = require('../../../models/core')('SprintDays');
const GroupListTable = require('../../../models/core')('Groups');
const WorklogsTable = require('../../../models/core')('Worklogs');
const UserMapsTable = require('../../../models/core')('UserMaps');
const utils = require('./CommonUtils');

function getSprintById (done, res, sprintid) {
  SprintListTable.findOne({_id: sprintid}, function(resData){
    done(null, resData);
  }, res, {path: 'sprintgroups'}, '');
}
function getAllSprint (done, res, module) {
  var queryObj = {};
  if (module != null) {
    queryObj.module = module;
  }
  SprintListTable.find(queryObj, function(resData){
    done(null, resData);
  }, res, {path: 'sprintgroups'}, '');
}

function getWorkLog (done, res, module, sprintid) {
  var queryObj = {'sprintid': sprintid};
  if (module != null) {
    queryObj.module = module;
  }
  WorklogsTable.findOne(queryObj, function(resData){
    var total = 0;
    if (resData && resData.data) {
      for (var key in resData.data) {
        total += resData.data[key].loggedEffort;
      }
      done(null, total);
    }else{
      done(null, 0);
    }
  }, res, '', '');
}

function getCapacity (done, res, module) {
  var queryObj = {};
  if (module != null) {
    queryObj.module = module;
  }
  UserMapsTable.aggregate([{$match: queryObj}, {$group: {_id: '$module', total: {$sum: '$capacity'}}}], function(resData){
    done(null, ((resData && resData[0] && resData[0].total) || 0));
  }, res);

}

function getSprintList(done, res, sprintid) {
  var event = eventProxy.all('sprintDone', 'sprintDaysDone', function(sprint, sprintDays) {
    var sprintgroups = sprint['sprintgroups'];
    var daysList = [];
    for (var i = 0;i < sprintDays.length; i++) {
      var sprintDayItem = sprintDays[i];
      var sprintDate = sprintDayItem['sprintdate'];
      var sprintDateObj = new Date(sprintDate + ' 00:00:00');
      var today = new Date();
      var todayEndDateObj = new Date(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() + 86400000);
      // console.log(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      // var todayEndDateObj = new Date(new Date().getTime() + 86400000);
      if(sprintDateObj < todayEndDateObj) {
        var dayObject = {
          day: i + 1,
          date: sprintDate,
          sprintid: sprintid
        };
        dayObject.groups = {};
        for (var j = 0; j < sprintgroups.length; j++) {
          var sprintGroupItem = sprintgroups[j];
          var groupName = sprintGroupItem.groupname;
          var group_id = sprintGroupItem['_id'];
          dayObject.groups[groupName] = {
            groupid: group_id
          };
        }
        daysList.push(dayObject);
      } else {
        break;
      }
    }
    if (sprintgroups == null) {
      sprintgroups = [];
    }
    done(null, [daysList, sprintDays.length, sprintgroups]);
  });
  SprintListTable.findOne({_id: sprintid}, function(resData){
    event.emit('sprintDone', utils.clone(resData));
  }, res, {path: 'sprintgroups'}, '');

  var sortOptions = {
    'sortby': 'sprintdate',
    'order': 1
  }
  SprintDaysTable.find({sprintid: sprintid}, function(sprintDaysRes) {
    event.emit('sprintDaysDone', utils.clone(sprintDaysRes));
  }, res, '', '', sortOptions);

  /*GroupListTable.find({}, function(resData){
    devent.emit('groupListDone', utils.clone(sprintDaysRes));
  }, res, '', '');*/
}
function searchSprintById(sprintList, id) {
  var returnSprint = null;
  for (var i = 0; i < sprintList.length; i++) {
    var sprintItem = sprintList[i];
    var sprint_id = sprintItem['_id'];
    if (sprint_id === id) {
      returnSprint = sprintItem;
      break;
    }
  }
  return returnSprint;
}
module.exports = {
  getSprintList: getSprintList,
  getAllSprint: getAllSprint,
  getSprintById: getSprintById,
  getWorkLog: getWorkLog,
  getCapacity: getCapacity
};