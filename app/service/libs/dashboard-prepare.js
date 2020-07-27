var config= require('config-lite')({
  config_basedir: __dirname
});

function getLeftDays(sprintInfo){
  var workdays= sprintInfo.workdays;
  var current= new Date().valueOf();
  var leftdays= 0;
  workdays.forEach(function(val, key, arr){
    if(new Date(val).valueOf()> current){
      leftdays++;
    }
  })
  return leftdays;
}

function getTotalPoints(list) {
  var total= 0;
  list.forEach(function(val, key, arr){
    if(config.status.moveout != val.status){
      total += val.points;
    }
  });
  return total;
}

function getInprogressPoints(list) {
  var total= 0;
  list.forEach(function(val, key, arr){
    if((config.status.commited).indexOf(val.status) == -1 && (config.status.done).indexOf(val.status) == -1 && config.status.moveout != val.status){
      total += val.points;
    }
  });
  return total;
}

function getInprogressStories(list) {
  var total= [];
  list.forEach(function(val, key, arr){
    if((config.status.commited).indexOf(val.status) == -1 && (config.status.done).indexOf(val.status) == -1 && config.status.moveout != val.status){
      total.push(val);
    }
  });
  return total;
}

function getCommitedPoints(list) {
  var total= 0;
  list.forEach(function(val, key, arr){
    if((config.status.commited).indexOf(val.status) != -1){
      total += val.points;
    }
  });
  return total;
}

function getOnlyCommitedPoints(list) {
  var total= 0;
  list.forEach(function(val, key, arr){
    if((config.status.commited).indexOf(val.status) != -1 && (config.status.done).indexOf(val.status) == -1){
      total += val.points;
    }
  });
  return total;
}

function getOnlyCommitedStories(list) {
  var total= [];
  list.forEach(function(val, key, arr){
    if((config.status.commited).indexOf(val.status) != -1 && (config.status.done).indexOf(val.status) == -1){
      total.push(val);
    }
  });
  return total;
}

function getInitialCommitedPoints(list) {
  var total= 0;
  list.forEach(function(val, key, arr){
    if((config.status.commited).indexOf(val.initialstatus) != -1){
      total += val.points;
    }
  });
  return total;
}

function getDonePoints(list) {
  var total= 0;
  list.forEach(function(val, key, arr){
    if((config.status.done).indexOf(val.status) != -1){
      total += val.points;
    }
  });
  return total;
}

function getDoneStories(list) {
  var total= [];
  list.forEach(function(val, key, arr){
    if((config.status.done).indexOf(val.status) != -1){
      total.push(val);
    }
  });
  return total;
}

function getCurrentDays(sprintinfo, input){
  var workdays= sprintinfo.workdays;
  var current= input? new Date(input).valueOf() : new Date().valueOf();
  var pastdays= 0;
  (workdays||[]).forEach(function(val, key, arr){
    if(new Date(val).valueOf()<= current){
      pastdays++;
    }
  })
  return pastdays;
};

module.exports.getLeftDays = getLeftDays;
module.exports.getTotalPoints = getTotalPoints;
module.exports.getCurrentDays = getCurrentDays;
module.exports.getCommitedPoints = getCommitedPoints;
module.exports.getOnlyCommitedPoints = getOnlyCommitedPoints;
module.exports.getDonePoints = getDonePoints;
module.exports.getInitialCommitedPoints = getInitialCommitedPoints;
module.exports.getOnlyCommitedStories = getOnlyCommitedStories;
module.exports.getDoneStories = getDoneStories;
module.exports.getInprogressPoints = getInprogressPoints;
module.exports.getInprogressStories = getInprogressStories;
