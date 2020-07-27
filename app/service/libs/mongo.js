var createModel= require('./create-model');
var mongoose = require('mongoose');

//Users
exports.Users= createModel('Users', 
  { 
    username: {type: 'String', required: true, unique: true},
    password: String,
    permission: Number, //1, 2, 3, 5, 8
    role: String,
    modules: Array //CDP
  }
);
// var t = {'username': 'admin', 'password': 'admin', 'permission': 1, 'role':'admin', 'modules':['CDP']}
//UserStorys
exports.UserStorys = createModel('UserStorys', 
  { 
    storykey:  String,
    name: String,
    points: Number,
    issuetype: String,
    status: String, 
    summary: String,
    sprint: {type: mongoose.Schema.Types.ObjectId, ref: 'SprintLists'},
    ingroup: [{type: mongoose.Schema.Types.ObjectId, ref: 'Groups'}],
    source: String, //scan, append, moveout
    createdby: String,
    lastmodifiedby: String,
    initialstatus: String,
    assignee: String
  }
);


//UserStorysAudit
exports.UserStoryAudits = createModel('UserStoryAudits', 
  { 
    storyid: {type: mongoose.Schema.Types.ObjectId, ref: 'UserStorys'},
    changereason: String,
    changefield: String,
    databeforechange: String,
    dataafterchange: String,
    changeinsprintday: Number,
    createdby: String,
    source: {type: String, default: 'sys'}, //'jira, sys'
    jiracreatedat: Date,
    sprint: {type: mongoose.Schema.Types.ObjectId, ref: 'SprintLists'}
  }
);

//StoryIssue
exports.StoryIssues = createModel('StoryIssues', 
  { 
    storyid: {type: mongoose.Schema.Types.ObjectId, ref: 'UserStorys'},
    issuekey: {type: 'String', required: true, unique: true},
    name: String,
    follower: String,
    issuegroup: [{type: mongoose.Schema.Types.ObjectId, ref: 'Groups'}],
    category: String,
    sprint: {type: mongoose.Schema.Types.ObjectId, ref: 'SprintLists'},
    comments: String,
    status: String,
    createdby: String,
    lastmodifiedby: String
  }
);

//StoryIssueAudit
exports.StoryIssueAudits = createModel('StoryIssueAudits', 
  { 
    issueid: {type: mongoose.Schema.Types.ObjectId, ref: 'StoryIssues'},
    changereason: String,
    changefield: String,
    databeforechange: String,
    dataafterchange: String,
    changeinsprintday: Number,
    createdby: String
  }
);

exports.Groups = createModel('Groups', 
  { 
    groupname: {type: 'String', required: true},
    groupcategory: String, // story group(dev,qa) or other groups
    description: String,
    status: {type: String, default: 'active'}, //deleted
    module: String,
    grouppointstatus: Array,  // when meet the status, the point will be reduced ['Initial','Ready for testing','Resolved']
    groupworkingstatus: Array, // the status that the group is working ['Ready for testing'] if for qa and ['open'] for dev
    isdefault: {type: String, default: 'no'} //yes, no
  },
  {
    groupname: 1,
    module: 1
  }
);
//SprintList
exports.SprintLists = createModel('SprintLists', 
  { 
    key: {type: 'String', required: true, unique: true},
    sprint: String,
    release: String,
    status: String, //planning, inprogress, done
    start: String,
    end: String,
    workdays: Array,
    createdby: String,
    lastmodifiedby: String,
    module: String,
    plannedpoints: Number,
    sprintgroups: [{type: mongoose.Schema.Types.ObjectId, ref: 'Groups'}],
    jql: String
  }
);

exports.SprintDays = createModel('SprintDays', 
  {
    sprintid: {type: mongoose.Schema.Types.ObjectId, ref: 'SprintLists'},
    sprintdate: String,
    createdby: String,
    lastmodifiedby: String
  }
);

//Worklogs 
exports.Worklogs = createModel('Worklogs', {
  sprintid: {type: mongoose.Schema.Types.ObjectId, ref: 'SprintLists'},
  data: mongoose.Schema.Types.Mixed
});

//UserMap
exports.UserMaps = createModel('UserMaps', {
  module: String,
  userid: String,
  displayname: String,
  employeeid: String,
  capacity: Number
});
// var t = {'module': 'CDP', 'userid': 'admin', 'displayname': 'CDP', 'employeeid':'i326432', 'capacity':1}
//Module 
exports.Modules = createModel('Modules', {
  key: {type: 'String', required: true, unique: true},
  displayname: String,
  admin: Array,
  token: String,
  createdby: String
});
// var t = {'key': 'CDP', 'displayname': 'CDP', 'admin': ['admin'], 'token':'', 'createdby': 'Tai'}