var config = require('config-lite')({
  config_basedir: __dirname
});
var mongoose = require('mongoose');
mongoose.plugin(require('./last-mod'));
var connection = mongoose.createConnection(config.mongodb);
// Use native promises
mongoose.Promise = global.Promise;

module.exports= function(name, fields, indexs){
  fields.createdAt= Date;
  var schema= mongoose.Schema(fields);
  if(indexs){
    schema.index(indexs, { unique: true });
    schema.set('autoIndex', config.autoIndex);
  }
  var tempModel= connection.model(name, schema);
  return tempModel;
}