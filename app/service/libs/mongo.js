var createModel= require('./create-model');
var mongoose = require('mongoose');

//UserStorys
exports.UserStorys= createModel('UserStorys', 
  { 
    storykey:  {type: 'String', required: true, unique: true},
    name: String,
    points: Number,
    status: String,
    category: String,
    createdby: String,
    lastmodifiedby: String
  }
);


//UserStorysAudit
exports.UserStorysAudit= createModel('UserStorysAudit', 
  { 
    storyid: {type: mongoose.Schema.Types.ObjectId, ref: 'UserStorys'},
    changereason: String,
    changefield: Number,
    databeforechange: String,
    dataafterchange: String,
    createdby: String
  }
);

//StoryIssue
exports.StoryIssue= createModel('StoryIssue', 
  { 
    storyid: {type: mongoose.Schema.Types.ObjectId, ref: 'UserStorys'},
    issuekey: {type: 'String', required: true, unique: true},
    name: String,
    follower: String,
    category: String,
    status: String,
    createdby: String,
    lastmodifiedby: String
  }
);

//StoryIssueAudit
exports.StoryIssueAudit= createModel('StoryIssueAudit', 
  { 
    issueid: {type: mongoose.Schema.Types.ObjectId, ref: 'StoryIssue'},
    changereason: String,
    changefield: Number,
    databeforechange: String,
    dataafterchange: String,
    createdby: String
  }
);
