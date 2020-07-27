const eventProxy= require('../../../libs/event-proxy').getEventProxy();
const GroupListTable = require('../../../models/core')('Groups');
const utils = require('./CommonUtils');

function getAllGroups (done, res) {
  GroupListTable.find({}, function(resData){
    done(null, resData);
  }, res, '', '');
}

module.exports = {
  getAllGroups: getAllGroups
};