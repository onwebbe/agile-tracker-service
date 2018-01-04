var MenusModel= require('../models/core')('Menus');

function deepClone(initalObj) {
  var obj = {};
  obj = JSON.parse(JSON.stringify(initalObj));
  return obj;
};

function formatMenu(originData){
  var rootmenu= [];
  var submenu= {};
  var data= sortMenu(originData);
  for(var idx=0; idx< data.length; idx++){
    if(!data[idx].category){
      rootmenu.push(data[idx]);
    }else{
      if(!submenu[data[idx].category]){
        submenu[data[idx].category]= [data[idx]];
      }else{
        submenu[data[idx].category].push(data[idx]);
      }
    }
  }

  for(var idx=0; idx< data.length; idx++){
    data[idx].children= submenu[data[idx].key] || [];
  }

  return rootmenu;
};

function sortMenu(data){
  var initList= ['home', 'solutions', 'products', 'software', 'services', 'company', 'news'];
  data.sort(function(data1, data2){
    return initList.indexOf(data1.key.toLowerCase())- initList.indexOf(data2.key.toLowerCase());
  });
  return data;
};

module.exports.getMenuArr= function(handler){
  MenusModel.find({}, handler);
}