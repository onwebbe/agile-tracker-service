var config = require('config-lite')({
  config_basedir: __dirname
});
var superagent= require('superagent');
var logger= require('./logger')();
var async = require('async');
var userStorysModel= require('../models/core')('UserStorys');
var moduleModel= require('../models/core')('Modules');
var getEventProxy= require('./event-proxy').getEventProxy;

module.exports.checkOpenStories= function(options, callback){
  var ep= getEventProxy();
  if(!options.jql){
    callback('Jql is required!', []);
  }
  moduleModel.findOne({key: options.module}, function(resData){
    if(resData && resData.token){
      logger.info('Token get:' + resData.token);
      var token= resData.token;
      ep.once('storySuccess', function(data){
        fetchSubTask(data, options, callback, token);
      });
      fetchStory(options.jql, ep, token, callback);
    }else{
      logger.error('Cannot get the module token:' + options.module);
      callback('Token fetched failed!');
    }
  });
}

function fetchStory(jql, ep, token, callback) {
  logger.info('Story data request started!');
  superagent.get('https://jira.successfactors.com/rest/api/2/search?jql='+ jql + '&fields=summary,issuetype,status,subtasks,assignee&maxResults=1500')
  .set('Authorization', 'Basic '+ token)
  .set('Accept', 'application/json')
  .end(function(err, res){
    if(err){
      logger.error('Data fetched failed as:', err);
      callback(JSON.parse(res.text).errorMessages);
      return false;
    }
    logger.info('Story data request finished, the count is:' + JSON.parse(res.text).issues.length);
    ep.emit('storySuccess', (JSON.parse(res.text).issues || []));
  });    
};

function fetchSubTask(data, options, callback, token){
  var subTasks= [];
  var tempTasks= [];
  (data || []).forEach(function(value, key, arr){
    tempTasks= value.fields.subtasks || [];
    tempTasks.forEach(function(task, id, tasks){
      subTasks.push(task.key);
    })
  });
  var tasksJql= 'issuekey in (' + subTasks.join(',') + ')';
  generateApiCall(tasksJql, options, callback, token, data);
}

function generateApiCall(jql, options, callback, token, originStoryData){
  logger.info('Subtask data request started!');
  superagent.get('https://jira.successfactors.com/rest/api/2/search?fields=assignee,aggregatetimeestimate,worklog&maxResults=5000&jql=' + jql)
  .set('Authorization', 'Basic '+ token)
  .set('Accept', 'application/json')
  .end(function(err, res){
    if(err){
      logger.error('Subtask data fetched failed as:', err);
      callback('Subtask data fetched failed!');
    }
    logger.info('Subtask data request finished, the count is:' + JSON.parse(res.text).issues.length);
    // callback(null, (JSON.parse(res.text).issues || []));
    getAllEffortLogStats((JSON.parse(res.text).issues || []), options, callback, originStoryData);
  }); 
}

function getAllEffortLogStats(data, options, callback, originStoryData){
  var loggedSubtasks = [];
  for(var idx=0; idx < (data || []).length; idx++) {
    if (data[idx].fields.worklog.worklogs.length > 0) {
      loggedSubtasks.push(data[idx].key);
    }
  }
  if (loggedSubtasks.length === 0) {
    callback(null, []);
    logger.info('Check finished with:' + 0);
    return false;
  }
  var openedLoggedStories = [];
  for (var idy=0; idy< (originStoryData || []).length; idy++) {
    for (var idz=0; idz < originStoryData[idy].fields.subtasks.length; idz++) {
      if (loggedSubtasks.indexOf(originStoryData[idy].fields.subtasks[idz].key) != -1) {
        openedLoggedStories.push(originStoryData[idy]);
        break;
      }
    }
  }
  callback(null, openedLoggedStories);
  logger.info('Check finished with:' + openedLoggedStories.length);
}

module.exports.checkOpenEpics= function(options, callback){
  var ep= getEventProxy();
  if(!options.jql){
    callback('Jql is required!', []);
  }
  moduleModel.findOne({key: options.module}, function(resData){
    if(resData && resData.token){
      var token= resData.token;
      ep.once('storySuccess', function(data){
        fetchSubIssues(data, options, callback, token);
      });
      fetchStory(options.jql, ep, token, callback);
    }else{
      logger.error('Cannot get the module token:' + options.module);
      callback('Token fetched failed!');
    }
  });
}

function fetchSubIssues(data, options, callback, token){
  var epics= [];
  (data || []).forEach(function(value, key, arr){
    epics.push(value.key);
  });
  var tasksJql= '"Epic Link" in (' + epics.join(',') + ')';
  logger.info('Sub-issues data request started!');
  superagent.get('https://jira.successfactors.com/rest/api/2/search?fields=status,customfield_11181&maxResults=5000&jql=' + tasksJql)
  .set('Authorization', 'Basic '+ token)
  .set('Accept', 'application/json')
  .end(function(err, res){
    if(err){
      logger.error('Sub-issues data fetched failed as:', err);
      callback('Sub-issues data fetched failed!');
    }
    logger.info('Sub-issues data request finished, the count is:' + JSON.parse(res.text).issues.length);
    // callback(null, (JSON.parse(res.text).issues || []));
    checkSubissuesStatus((JSON.parse(res.text).issues || []), callback, data);
  });

  function checkSubissuesStatus(issues, callback, data) {
    var epicsMap = {};
    for (var idx=0; idx< data.length; idx++) {
      epicsMap[data[idx].key] = data[idx];
    }
    var epicsWithOpenedIssues = [];
    for(var idy=0; idy< issues.length; idy++){
      if (issues[idy].fields.status.statusCategory.key != 'done') {
        epicsWithOpenedIssues[issues[idy].fields.customfield_11181] = true;
      }
    }
    var res = [];
    for (var key in epicsMap) {
      if(!epicsWithOpenedIssues[key]){
        res.push(epicsMap[key]);
      }
    }
    callback('', res);
  }
}

