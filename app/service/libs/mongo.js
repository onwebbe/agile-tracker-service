var createModel= require('./create-model');
var mongoose = require('mongoose');

//Users
exports.Users= createModel('Users', 
  { 
    username: {type: 'String', required: true, unique: true},
    password: String,
    permission: Number, //1, 2, 3, 5, 8
    role: String
  }
);

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

//SprintList
exports.SprintList= createModel('SprintList', 
  { 
    key: {type: 'String', required: true, unique: true},
    sprint: String,
    release: String,
    status: String,
    start: String,
    end: String,
    createdby: String,
    lastmodifiedby: String
  }
);
