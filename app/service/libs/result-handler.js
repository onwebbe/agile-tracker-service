var logger= require('./logger')();
const messageMap= {
  REQUEST_SUCCESS: {
    status: 'success',
    code: 200,
    resMsg: 'Data request successfully!'
  },
  INTERNAL_ERROR: {
    status: 'error',
    code: 500,
    resMsg: 'Something wrong, try again later or contact admin, thanks!'
  },
  FORMAT_INVALID: {
    status: 'error',
    code: 1,
    resMsg: 'The request format or paramters are invalid'
  },
  DATA_NOT_FOUND: {
    status: 'error',
    code: 2,
    resMsg: 'The data is not found in database'
  },
  DATA_EXISTED: {
    status: 'error',
    code: 3,
    resMsg: 'The data has exist in database'
  },
  DATA_INVALID: {
    status: 'error',
    code: 4,
    resMsg: 'The data is invalid'
  },
  LOGIN_REQUIRED: {
    status: 'error',
    code: 5,
    resMsg: 'Please login first'
  },
  PERMISSION_DENIED: {
    status: 'error',
    code: 6,
    resMsg: 'You have no permission to operate'
  }
};

module.exports= {
  responseInfo: function responseInfo(key, res, detail) {
    res.send({
      'status': messageMap[key].status,
      'code': messageMap[key].code,
      'resMsg': messageMap[key].resMsg,
      'resData': detail || {}
    });
    if(detail && key != 'REQUEST_SUCCESS'){
      logger.error('Requst failed since:', detail);
    }
    return false;
  }
}