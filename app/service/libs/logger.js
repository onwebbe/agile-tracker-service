var log4js = require('log4js');
var config = require('config-lite')({
  config_basedir: __dirname
});
log4js.configure({
  appenders: {
    out: {
      type: 'console',
      level: config.loggerLevel
    },
    errorAppen: {
      type: 'file',
      filename: './logger/error.log' 
    },
    error: {
      type: 'logLevelFilter',
      maxLevel: 'error',
      level: 'error',
      appender: 'errorAppen'
    },
    warnAppen: {
      type: 'file',
      filename: './logger/warn.log' 
    },
    warn: {
      maxLevel: 'warn',
      level: 'warn',
      appender: 'warnAppen',
      type: 'logLevelFilter'
    },
    infoAppen: {
      type: 'file',
      filename: './logger/info.log' 
    },
    info: {
      maxLevel: 'info',
      level: 'info',
      appender: 'infoAppen',
      type: 'logLevelFilter'
    },
    debugAppen: {
      type: 'file',
      filename: './logger/debug.log' 
    },
    debug: {
      maxLevel: 'debug',
      level: 'debug',
      appender: 'debugAppen',
      type: 'logLevelFilter'
    }
  },
  categories: {
    default: { appenders: ['out', 'error', 'warn', 'info', 'debug'], level: config.loggerLevel }
  }
});

module.exports= function(category){
  return log4js.getLogger(category);
}