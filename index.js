// agile-tracker entrance

/**
* @name agile-tracker
* @version 1.0.0
* @author brian.hao211@gmail.com
* @fileoverview Entrance of app.
**/

var express= require('express');
var app= express();
var config= require('config-lite')({
  config_basedir: __dirname
});
var path= require('path');
var logger= require('./app/service/libs/logger')('service');
var session= require('express-session');
var MongoStore= require('connect-mongo')(session);
//获取路由
var routers= require('./app/service/routers/index');

//设置静态目录
app.use(express.static(path.join(__dirname, 'public')));

//设置session中间件
app.use(session({
  name: config.session.key, //设置cookie中sessionId字段名称
  secret: config.session.secret,// 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
  resave: true,// 强制更新 session
  saveUninitialized: true,// 设置为 false，强制创建一个 session，即使用户未登录
  cookie: {
    maxAge: config.session.maxAge// 过期时间，过期后 cookie 中的 session id 自动删除
  },
  store: new MongoStore({// 将 session 存储到 mongodb
    url: config.mongodb// mongodb 地址
  })
}));

routers(app);

app.listen(config.port, function(err) {
  if(err){
    logger.error('Server start fail due to:'+ err);
    return false;
  }
  logger.info('Server start successfully!')
})