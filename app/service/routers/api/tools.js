var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var logger= require('../../libs/logger')();
var async = require('async');
var config= require('config-lite')({
  config_basedir: __dirname
});
var checkTools = require('../../libs/jira-tools');
var requestHandler = require('../../libs/result-handler');

router.post('/checkstory', function(req, res, next) {
  var jql = req.body.jql;
  var module = req.body.module || 'CDP';
  if (!jql) {
    requestHandler.responseInfo('FORMAT_INVALID', res, {});
    return;
  }
  async.waterfall([
    function (callback) {
      checkTools.checkOpenStories({jql: jql, module: module}, callback);
    }
  ], function(err, results) {
    var modules = {};
    var list = [];
    if (err) {
      logger.error('Open stroies check failed as:' + err);
      requestHandler.responseInfo('FORMAT_INVALID', res, {});
      return false;
    }
    for (var idx=0; idx< (results && results.length); idx++) {
      modules[results[idx].key.split('-')[0]] = true;
      list.push({
        key: results[idx].key,
        assignee: results[idx].fields.assignee.displayName,
        type: results[idx].fields.issuetype.name,
        status: results[idx].fields.status.name,
        summary: results[idx].fields.summary
      });
    }
    requestHandler.responseInfo('REQUEST_SUCCESS', res, {modules: modules, list: list});
  })
});

router.post('/checkepic', function(req, res, next) {
  var jql = req.body.jql;
  var module = req.body.module || 'CDP';
  if (!jql) {
    requestHandler.responseInfo('FORMAT_INVALID', res, {});
    return;
  }
  async.waterfall([
    function (callback) {
      checkTools.checkOpenEpics({jql: jql, module: module}, callback);
    }
  ], function(err, results) {
    var modules = {};
    var list = [];
    if (err) {
      logger.error('Open stroies check failed as:' + err);
      requestHandler.responseInfo('FORMAT_INVALID', res, {});
      return false;
    }
    for (var idx=0; idx< (results && results.length); idx++) {
      modules[results[idx].key.split('-')[0]] = true;
      list.push({
        key: results[idx].key,
        assignee: results[idx].fields.assignee.displayName,
        type: results[idx].fields.issuetype.name,
        status: results[idx].fields.status.name,
        summary: results[idx].fields.summary
      });
    }
    requestHandler.responseInfo('REQUEST_SUCCESS', res, {modules: modules, list: list});
  })
});

module.exports = router;