var config = require('config-lite')({
  config_basedir: __dirname
});
var superagent= require('superagent');
var usersModel= require('../models/core')('Users');
var logger= require('./logger')();
var async = require('async');
var userStorysModel= require('../models/core')('UserStorys');
var moduleModel= require('../models/core')('Modules');

module.exports.launchCall= function(type, options, ep, callback){
  if(!options.jql){
    callback('Jql is required!', []);
  }
  moduleModel.findOne({key: options.module}, function(resData){
    if(resData && resData.token){
      var token= resData.token;
      fetchStory(options.jql, options.expand, ep, token);
      if(type === 'worklog'){
        ep.once('storyMergedUpdateSuccess', function(data){
          fetchSubTask(data, options, callback, token);
        });
        ep.all('storyListInfo', 'storySuccess', function(dbList, jiraList){
          storyMakeUpForWorkLog(dbList, jiraList, ep, token);
        })
        userStorysModel.find({'sprint': options.sprintid}, function(resData){
          ep.emit('storyListInfo', resData);
        }) 
      }
    }else{
      logger.error('Cannot get the module token:' + options.module);
      callback('Token fetched failed!');
    }
  });
}

function storyMakeUpForWorkLog(dbList, jiraList, ep, token){
  var tempArr= [];
  var tempJiraMap= {};
  (jiraList || []).forEach(function(val, key, arr){
    tempJiraMap[val.key]= true;
  });
  (dbList || []).forEach(function(val, key, arr){
    if(!tempJiraMap[val.storykey]){
      tempArr.push(val.storykey);
    }
  });
  if(tempArr.length>0){
    logger.info('Start make up story list: ', tempArr.length);
    var jql= 'issuekey in (' + tempArr.join(',') + ')';
    superagent.get('https://jira.successfactors.com/rest/api/2/search?jql='+ jql + '&maxResults=1000&fields=summary,issuetype,customfield_10240,customfield_10402,status,subtasks,assignee' + '&expand=changelog')
    .set('Authorization', 'Basic '+ token)
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
    .set('Cookie', '_ga=GA1.2.2138842886.1565750223; AMCV_227AC2D754DCAB340A4C98C6%40AdobeOrg=1585540135%7CMCIDTS%7C18199%7CMCMID%7C62759538199513150742022464219423186378%7CMCAAMLH-1572936620%7C9%7CMCAAMB-1572936620%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1572339021s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.4.0; mbox=session#34a335649bfc40cead0d1ffc0d954095#1572333684|PC#6694b857190b4a34987109853a003404.28_109#1635576624; LPVID=FiZWExMzkzZjhlMjlhN2Fj; LOGOUTCOOKIE=1cd60907-7062-4e3c-b2c2-511c928a6db2; JSESSIONID=123F59CAD36F871A0D2FBA93856CAE24; SESSIONCOOKIE=SessionCookie; SAMLCOOKIE=tDdJMhA+qbyr1PSXLeGzXkE+Dv/CVVgf+xuHP0oQ1vkwp58feXsGtDycmTzc8uZHaMWSD9EhB7guB/cGN8cReQ==; atlassian.xsrf.token=AU6R-ZM9V-XXIL-R3RX_ae3a55e9cc464aa227a8829b87d51f53c3031676_lin')
    .set('Sec-Fetch-User', '?1')
    .end(function(err, res){
      if(err){
        logger.error('Data fetched failed as:', err);
        ep.emit('storyEror', 'Data fetched failed!');
        return false;
      }
      logger.info('Make up story list finished, the count is:' + JSON.parse(res.text).issues.length);
      ep.emit('storyMergedUpdateSuccess', jiraList.concat(JSON.parse(res.text).issues || []));
    });     
  }else{
    logger.info('Do not need  make up any story');
    ep.emit('storyMergedUpdateSuccess', jiraList);
  }
};

function fetchStory(jql, expand, ep, token) {
  logger.info('Story data request started!');
  superagent.get('https://jira.successfactors.com/rest/api/2/search?jql='+ jql + '&maxResults=1000&fields=summary,issuetype,customfield_10240,customfield_10402,status,subtasks,assignee' + '&expand=' + expand)
  .set('Authorization', 'Basic '+ token)
  .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
  .set('Cookie', '_ga=GA1.2.2138842886.1565750223; AMCV_227AC2D754DCAB340A4C98C6%40AdobeOrg=1585540135%7CMCIDTS%7C18199%7CMCMID%7C62759538199513150742022464219423186378%7CMCAAMLH-1572936620%7C9%7CMCAAMB-1572936620%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1572339021s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.4.0; mbox=session#34a335649bfc40cead0d1ffc0d954095#1572333684|PC#6694b857190b4a34987109853a003404.28_109#1635576624; LPVID=FiZWExMzkzZjhlMjlhN2Fj; LOGOUTCOOKIE=1cd60907-7062-4e3c-b2c2-511c928a6db2; JSESSIONID=123F59CAD36F871A0D2FBA93856CAE24; SESSIONCOOKIE=SessionCookie; SAMLCOOKIE=tDdJMhA+qbyr1PSXLeGzXkE+Dv/CVVgf+xuHP0oQ1vkwp58feXsGtDycmTzc8uZHaMWSD9EhB7guB/cGN8cReQ==; atlassian.xsrf.token=AU6R-ZM9V-XXIL-R3RX_ae3a55e9cc464aa227a8829b87d51f53c3031676_lin')
  .set('Sec-Fetch-User', '?1')
  .end(function(err, res){
    if(err){
      logger.error('Data fetched failed as:', err);
      ep.emit('storyEror', 'Data fetched failed!');
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
  // async.mapLimit([tasksJql], 30, generateApiCall, function(err, results){
  //   if(err){
  //     callback(err);
  //     return false;
  //   }
  //   getAllEffortLogStats(results[0], options, callback);
  // });
  if (subTasks.length > 0) {
    generateApiCall(tasksJql, options, callback, token);
  } else {
    getAllEffortLogStats([], options, callback);
  }
}

function generateApiCall(jql, options, callback, token){
  logger.info('Subtask data request started!');
  superagent.get('https://jira.successfactors.com/rest/api/2/search?fields=assignee,aggregatetimeestimate,worklog&maxResults=1000&jql=' + jql)
  .set('Authorization', 'Basic '+ token)
  .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3')
  .set('Cookie', '_ga=GA1.2.2138842886.1565750223; AMCV_227AC2D754DCAB340A4C98C6%40AdobeOrg=1585540135%7CMCIDTS%7C18199%7CMCMID%7C62759538199513150742022464219423186378%7CMCAAMLH-1572936620%7C9%7CMCAAMB-1572936620%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1572339021s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.4.0; mbox=session#34a335649bfc40cead0d1ffc0d954095#1572333684|PC#6694b857190b4a34987109853a003404.28_109#1635576624; LPVID=FiZWExMzkzZjhlMjlhN2Fj; LOGOUTCOOKIE=1cd60907-7062-4e3c-b2c2-511c928a6db2; JSESSIONID=123F59CAD36F871A0D2FBA93856CAE24; SESSIONCOOKIE=SessionCookie; SAMLCOOKIE=tDdJMhA+qbyr1PSXLeGzXkE+Dv/CVVgf+xuHP0oQ1vkwp58feXsGtDycmTzc8uZHaMWSD9EhB7guB/cGN8cReQ==; atlassian.xsrf.token=AU6R-ZM9V-XXIL-R3RX_ae3a55e9cc464aa227a8829b87d51f53c3031676_lin')
  .set('Sec-Fetch-User', '?1')
  .end(function(err, res){
    if(err){
      logger.error('Subtask data fetched failed as:', err);
      callback('Subtask data fetched failed!');
    }
    logger.info('Subtask data request finished, the count is:' + JSON.parse(res.text).issues.length);
    // callback(null, (JSON.parse(res.text).issues || []));
    getAllEffortLogStats((JSON.parse(res.text).issues || []), options, callback);
  }); 
}

function getAllEffortLogStats(data, options, callback){
  var result = {};
  data.forEach(function(value, key, arr){
    if(result[((value.fields.assignee && value.fields.assignee.key.replace(/\./g, '')) || 'unassigned')]){
      result[((value.fields.assignee && value.fields.assignee.key.replace(/\./g, '')) || 'unassigned')].leftEstimate = result[((value.fields.assignee && value.fields.assignee.key.replace(/\./g, '')) || 'unassigned')].leftEstimate + value.fields.aggregatetimeestimate;
      if(value.fields.aggregatetimeestimate > 0){
        result[((value.fields.assignee && value.fields.assignee.key.replace(/\./g, '')) || 'unassigned')].leftList.push({
          key: value.key,
          leftEstimate: value.fields.aggregatetimeestimate,
          owner: value.fields.assignee.key
        });
      }
    }else{
      result[((value.fields.assignee && value.fields.assignee.key.replace(/\./g, '')) || 'unassigned')] = {
        'leftEstimate': (value.fields.aggregatetimeestimate || 0),
        'loggedEffort': 0,
        'loggedHistory': [],
        'leftList': value.fields.aggregatetimeestimate > 0 ? [{
          key: value.key,
          leftEstimate: value.fields.aggregatetimeestimate,
          owner: value.fields.assignee.key
        }] : []
      };
    }
    (value.fields.worklog.worklogs || []).forEach(function(worklog, index, worklogArr){
      if((new Date(worklog.created).valueOf() > new Date(options.start || '').valueOf()) && (new Date(worklog.created).valueOf() < (new Date(options.end || '').valueOf()+ 1000*3600*24))){
        if(result[(worklog.author.key ? worklog.author.key : worklog.author.name).replace(/\./g, '')]){
          result[(worklog.author.key ? worklog.author.key : worklog.author.name).replace(/\./g, '')].loggedEffort = result[(worklog.author.key ? worklog.author.key : worklog.author.name).replace(/\./g, '')].loggedEffort + worklog.timeSpentSeconds;
          result[(worklog.author.key ? worklog.author.key : worklog.author.name).replace(/\./g, '')].loggedHistory.push({
            key: value.key,
            loggedEffort: worklog.timeSpent,
            created: worklog.created,
            owner: (worklog.author.key ? worklog.author.key : worklog.author.name)
          });
        }else{
          result[((value.fields.assignee && value.fields.assignee.key.replace(/\./g, '')) || 'unassigned')] = {
            'leftEstimate': 0,
            'loggedEffort': (worklog.timeSpentSeconds || 0),
            'leftList': [],
            'loggedHistory': [{
                key: value.key,
                loggedEffort: worklog.timeSpent,
                created: worklog.created,
                owner: (worklog.author.key ? worklog.author.key : worklog.author.name)
              }]
          };
        }
      }
    });
  });
  callback(null, result);
  logger.info('Task data done!');
}
