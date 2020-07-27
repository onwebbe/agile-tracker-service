function findAuditById(auditList, storyid, fieldName) {
  if (fieldName == null) {
    fieldName = 'storyid';
  }
  storyid = storyid;
  var resultAuditList = [];
  for (var i = 0; i < auditList.length; i++) {
    var item = auditList[i];
    var itemStoryID = item[fieldName];
    if (itemStoryID == storyid) {
      resultAuditList.push(item);
    }
  }
  return resultAuditList;
};
function clone(source) {
  return JSON.parse(JSON.stringify(source));
}

function isStatusInStatusList (status, statusList) {
  var isIn = false;
  for (let i = 0; i < statusList.length; i++) {
    let statusStr = statusList[i];
    if (status === statusStr) {
      isIn = true;
      break;
    }
  }

  return isIn;
}

function getDayGroupItem (summary, day, groupName) {
  var groupItem = null;
  for (let i = 0; i < summary.length; i++) {
    let summaryItem = summary[i];
    let summaryDay = summaryItem.day;
    if (day === summaryDay) {
      groupItem = summaryItem['groups'][groupName];
      break;
    }
  }
  return groupItem;
}

function getDayItemCompareWithPreviousDayItem (todayItem, previousDayItem) {
  var todayPoints = todayItem.points;
  var todayRed = todayPoints.redtotal;
  var todayAdd = todayPoints.addtotal;
  if (previousDayItem === null) {
    todayItem.points.red = todayRed;
    todayItem.points.add = todayAdd;
    return todayItem;
  }
  var previousPoints = previousDayItem.points;
  var previousRed = previousPoints.redtotal;
  var previousAdd = previousPoints.addtotal;

  var compareAdd = 0;
  var compareRed = 0;
  if ((todayRed - previousRed) > 0) {
    compareRed = todayRed - previousRed;
  } else {
    compareAdd = previousRed - todayRed;
  }

  if ((todayAdd - previousAdd) > 0) {
    compareAdd = todayAdd - previousAdd;
  } else {
    compareRed = previousAdd - todayAdd;
  }

  todayItem.points.red = compareRed;
  todayItem.points.add = compareAdd;

  return todayItem;
}

function findDBItemById(itemList, id) {
  for (let i = 0; i < itemList.length; i++) {
    let item = itemList[i];
    let itemid = item._id;
    if (id === itemid) {
      return item;;
    }
  }
  return null;
}
function getTodayStoryChangeByPreviousDay (todayItem, previousDayItem) {
  if (previousDayItem === null || previousDayItem === undefined) {
    return todayItem;
  }
  var minsValue = todayItem.currentPoint - previousDayItem.currentPoint;
  if (minsValue > 0) {
    todayItem.points.add = minsValue;
    todayItem.points.red = 0;
  } else {
    todayItem.points.red = -minsValue;
    todayItem.points.add = 0;
  }

  var todayReduceList = [];
  var todayDoneList = [];
  var todayRedList = todayItem.points.redStorys;
  var previousDayRedList = previousDayItem.points.redStorys;
  for (let i = 0; i < todayRedList.length; i++) {
    let todayItem = todayRedList[i];
    let previousDayItem = findDBItemById(previousDayRedList, todayItem._id);
    console.log('found previousDayItem:' + previousDayItem);
    if (previousDayItem === null) {
      todayReduceList.push(todayItem);
    }
  }
  todayItem.points.redStorys = todayReduceList;
  return todayItem;
}

function getStoryByGroup (storyList, groupName) {
  if (storyList === null || storyList === undefined) {
    return null;
  }
  var groupStory = [];
  for (let i = 0; i < storyList.length; i++) {
    var storyItem = storyList[i];
    var ingroup = storyItem.ingroup;
    for (let j = 0; j < ingroup.length; j++) {
      var grp = ingroup[j];
      if (grp.groupname === groupName) {
        groupStory.push(storyItem);
        break;
      }
    }
  }
  return groupStory;
}
module.exports = {
  findAuditById: findAuditById,
  clone: clone,
  isStatusInStatusList: isStatusInStatusList,
  getDayGroupItem: getDayGroupItem,
  getDayItemCompareWithPreviousDayItem: getDayItemCompareWithPreviousDayItem,
  getTodayStoryChangeByPreviousDay: getTodayStoryChangeByPreviousDay,
  getStoryByGroup: getStoryByGroup
};