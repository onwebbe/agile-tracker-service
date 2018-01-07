var express= require('express');
var router = express.Router();
var checkIsAdmin= require('../../middlewares/permission-check').checkIsAdmin;
var oModel= require('../../models/core')('SprintList');
var eventProxy= require('../../libs/event-proxy').getEventProxy();

router.post('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  data.key= data.release+'/'+data.sprint;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: '内容创建成功！',
      resData: resData
    });
    return false;
  };
  oModel.create(data, handler, res);
});

router.put('/', checkIsAdmin, function(req, res, next) {
  var data= req.body;
  var objid= data._id;
  delete data._id;
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: '内容更新成功！',
      resData: resData
    });
    return false;
  };
  oModel.findOneAndUpdate({'_id': objid}, data, handler, res); 
});

router.get('/latest', checkIsAdmin, function(req, res, next) {
  var condition= {
    status: 'inprogress'
  };
  var options= {
    'sortby': 'createdAt',
    'order': '-1'
  };
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: '数据获取成功！',
      resData: resData
    });
    return false;
  };
  oModel.findOne(condition, handler, res, '', '', options);
});

router.get('/', checkIsAdmin, function(req, res, next) {
  var condition= {
    // status: 'inprogress'
  };
  var options= {
    'sortby': 'createdAt',
    'order': '-1',
    'page': 1,
    'per_page': req.param.limit || 10
  };
  var handler= function(resData){
    res.send({
      status: 'success',
      resMsg: '数据获取成功！',
      resData: resData
    });
    return false;
  };
  oModel.find(condition, handler, res, '', '', options);
});

router.patch('/', checkIsAdmin, function(req, res, next) {
  var objid= req.query.objid;
  res.send({
    status: 'success',
    resMsg: '扫描成功！'
  });
});

module.exports = router;



