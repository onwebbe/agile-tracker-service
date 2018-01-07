var express= require('express');
var router = express.Router();
var oModel= require('../models/core')('Users');
// page entry
router.get('/', function(req, res, next) {
  oModel.create({
    'ad': 'test',
    'pach': 'test'
  }, function(){
    res.send('create successfully');
  }, res);

});

module.exports = router;

