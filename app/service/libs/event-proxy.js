var EventProxy= require('eventproxy');

module.exports= {
  getEventProxy: function getEventProxy() {
    return new EventProxy;
  }
}