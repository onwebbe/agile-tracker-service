var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var logger= require('../../libs/logger')();
var oModel= require('../../models/core')('Groups');

router.get('/:module', checkIsAdmin, function(req, res, next){
  var module= req.params.module;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data fetch successfully!',
      resData: resData
    });
    return false;
  };
  if(module){
    oModel.find({'module': module, 'status': 'active'}, handler, res);
  }else{
    res.send({
      status: 'error',
      resMsg: 'Data fetch failed!'
    });
  }
});

router.post('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data create successfully!',
      resData: resData
    });
    return false;
  };
  oModel.create(data, function(){
    oModel.find({'module': data.module, 'status': 'active'}, handler, res);
  }, res);
});

router.put('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  var objid= data._id;
  delete data._id;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data update successfully!',
      resData: resData
    });
    return false;
  };
  oModel.findOneAndUpdate({'_id': objid}, data, function(){
    oModel.find({'module': data.module, 'status': 'active'}, handler, res);
  }, res); 
});

router.delete('/', checkIsAdmin, function(req, res, next){
  var objid= req.query.objid;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: 'Data delete successfully!',
      resData: resData
    });
    return false;
  };
  oModel.findOneAndUpdate({'_id': objid}, {'status': 'deleted'}, function(){
    oModel.find({'module': req.query.module, 'status': 'active'}, handler, res);
  }, res);
});

module.exports= router;