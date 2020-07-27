var modelLib= require('../libs/mongo');
var logger= require('../libs/logger')();

module.exports= function(modleName){
  var model= modelLib[modleName];
  return {
    create: function create(newData, handler, res){
      newData['createdAt']= new Date().toLocaleString();
      return model.create(newData)
        .then(function(resData){
          handler(resData);
        })
        .catch(function(err){
          logger.error('Data create failed due to:[13]', err);
          if(res && err){
            if(err.code== 11000){
              res.send({
                status: 'error',
                resMsg: 'Sorry, duplicated data！'
              });
              return false;
            };
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        });
    },

    findOne: function findOne(condition, handler, res, populateObj, selection, options){
      if(!options){
        var options= {
          page: 1,
          per_page: 1000,
          sortby: 'lastMod',
          order: '-1'
        };
      }
      var sort= {};
      if(options && options.sortby && options.order){
        sort[options.sortby]= options.order;
      }else{
        sort['lastMod']= '-1';
      }
      return model.findOne(condition)
        .select((selection || ''))
        .populate((populateObj?populateObj.path: ''), (populateObj?populateObj.select: ''))
        .sort(sort)
        .then(function(resData){
          handler(JSON.parse(JSON.stringify(resData)));
        })
        .catch(function(err){
          logger.error('Data query failed due to:[29]', err);          
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        })
    },

    find: function find(condition, handler, res, populateObj, selection, options, params){
      if(!options){
        var options= {
          page: 1,
          per_page: 1000,
          sortby: 'lastMod',
          order: '-1'
        };
      }
      var sort= {};
      if(options && options.sortby && options.order){
        sort[options.sortby]= options.order;
      }else{
        sort['lastMod']= '-1';
      }
      return model.find(condition)
        .select((selection|| ''))
        .populate((populateObj?populateObj.path: ''), (populateObj?populateObj.select: ''))
        .sort(sort)
        .skip((options.page-1)*options.per_page)
        .limit(options.per_page)
        .then(function(resData){
          handler(JSON.parse(JSON.stringify(resData)), params);
        })
        .catch(function(err){
          logger.error('Data query failed due to:[45]', err);          
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        })
    },

    aggregate: function aggregate(condition, handler, res){
      return model.aggregate(condition)
        .then(function(resData){
          handler(resData);
        })
        .catch(function(err){
          logger.error('Data query failed due to:[45]', err);          
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        })
    },

    findOneAndUpdate: function findOneAndUpdate(condition, data, handler, res){
      return model.findOneAndUpdate(condition, data)
        .then(function(resData){
          handler(resData)
        })
        .catch(function(err){
          logger.error('Data update failed due to:[45]', err);          
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        })
    },

    remove: function remove(condition, handler, res){
      return model.remove(condition)
        .then(function(resData){
          handler(resData)
        })
        .catch(function(err){
          logger.error('Data remove failed due to:[61]', err);          
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        })
    },


    count: function count(condition, handler, res) {
      return model.count(condition)
        .then(function(resData){
          handler(resData);
        })
        .catch(function(err){
          logger.error('Data count query failed due to:[61]', err);
          if(res && err){
            res.send({
              status: 'error',
              resMsg: 'Internal server error!'
            });
          }
        });
    }/*,
    isFieldExists: function isFieldExists (fieldName) {
      return model.schema.obj[fieldName] != null;
    },
    createByFormData: function createByFormData (formData, handler, res) {
      var dataToInsert = {};
      for (field in formData) {
        if (this.isFieldExists(field)) {
          dataToInsert[field] = formData[field];
        }
      }
      var t = this.create(dataToInsert, handler, res);
      return t;
    }*/
  };
};