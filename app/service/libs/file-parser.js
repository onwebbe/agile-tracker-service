var formidable= require('formidable');
var fs= require('fs');
var path = require('path');
var mkdir= require('./mkdir');
var logger= require('../libs/logger')();
var eventproxy= require('../libs/event-proxy').getEventProxy();

module.exports= function(config){
  var dir= config.dir || 'public/static/default/';
  var form = new formidable.IncomingForm();   //创建上传表单
  var res= config.res;
  if (mkdir.mkdirsSync(dir)){
    form.uploadDir = dir;  //设置上传目录
  }else{
    res.send('文件上传失败，请联系管理员！');
    logger.error('文件夹创建失败', dir);
    res.send({
      status: 'error',
      resMsg: '对不起文件上传失败，请稍后重试或联系管理员！'
    });
    return false;
  }
  form.encoding = 'utf-8';    //设置编辑
  form.keepExtensions = config.keepExtensions || true;   //保留后缀
  form.maxFieldsSize = config.maxFieldsSize || 2 * 1024 * 1024;   //文件大小
  form.multiples = config.multiples || true;
  var req= config.req;

  form.parse(req, function(err, fields, files) {
      var savedFiles= [];
      if(err){
        res.send({
          status: 'error',
          resMsg: '对不起文件上传失败，请稍后重试或联系管理员！'
        });
        logger.error('文件夹解析失败', err);
        return false;
      }
      var fileArr= Array.isArray(files.file)?files.file: [files.file];
      var extName = '';  //后缀名
      try{
        for(var idx=0; idx< fileArr.length; idx++){
          if(!fileArr[idx] || !fileArr[idx].size || fileArr[idx].size> config.maxFieldsSize){
            res.send({
              status: 'error',
              resMsg: '对不起单个文件超过最大限制'+form.maxFieldsSize/1024/1024+'Mb！'
            });
            for(var idx=0; idx< fileArr.length; idx++){
              fs.unlink(fileArr[idx].path);
            }
            logger.error('对不起单个文件超过最大限制', fileArr[idx].path);
            return false;
          }
          if(config.isLimitType){
            switch (fileArr[idx].type) {
              case 'image/pjpeg':
                extName = 'jpg';
                break;
              case 'image/jpeg':
                extName = 'jpg';
                break;     
              case 'image/png':
                extName = 'png';
                break;
              case 'image/x-png':
                extName = 'png';
                break;
              case 'application/msword':
                extName = 'word';
                break;
              case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                extName = 'word';
                break;
              case 'application/pdf':
                extName = 'pdf';
                break;         
            }
            if(!extName){
              res.send({
                status: 'error',
                resMsg: '对不起文件上传失败，包含不支持类型文件！'
              });
              for(var idx=0; idx< fileArr.length; idx++){
                fs.unlink(fileArr[idx].path);
              }
              logger.error('对不起单个文件超过最大限制', fileArr[idx].path);
              return false;
            }
          }
          // var avatarName = fileArr[idx].path.split(path.sep).pop();
          var newPath = fileArr[idx].path.replace('upload_', Date.now());
          fs.renameSync(fileArr[idx].path, newPath);
          savedFiles.push({path: newPath, name: fileArr[idx].name, lang: (config.lang || 'en')});
        }
        eventproxy.emit((config.eventName || fileParseFinished), savedFiles); 
      }catch(err){
        for(var idx=0; idx< fileArr.length; idx++){
          fs.unlink(fileArr[idx].path);
        }
        res.send({
          status: 'error',
          resMsg: '对不起文件上传失败，请稍后重试或联系管理员！'
        });
        logger.error('文件解析出错:', err);
        return false;
      }
  });
}