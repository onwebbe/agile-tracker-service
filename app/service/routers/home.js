var express= require('express');
var router = express.Router();
var fs= require('fs');
var path= require('path');
var logger= require('../libs/logger')();
// page entry
router.get('/', function(req, res, next) {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../dist/index/index.html'), 'utf-8');
  res.send(html);
});

module.exports = router;