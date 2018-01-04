var EventProxy= require('eventproxy');
var eventproxy= new EventProxy();

module.exports= {
  getEventProxy: function getEventProxy() {
    return eventproxy;
  }
}