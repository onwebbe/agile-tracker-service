var nodemailer = require('nodemailer');
var config = require('config-lite')({
    config_basedir: __dirname
});
var logger= require('./logger')();
var eventproxy= require('./event-proxy').getEventProxy();

module.exports= function(targetUser, objPara){
    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        service: config.email.senderEmailType,
        auth: {
            user: config.email.senderAddress,
            pass: config.email.senderPass
        }
    });
    var htmlContent= '';
    // setup email data with unicode symbols
    var mailOptions = {
        from: config.email.senderName, // sender address
        to: targetUser, // list of receivers
        // bcc: config.email.bccEmail,
        subject: objPara.subject || config.email.subject, // Subject line
        text: objPara.textContent || config.email.text, // plain text body
        html:  objPara.htmlContent || htmlContent// html body
    };
    logger.info('Message from', config.email.senderName, 'to', targetUser, 'sent started!');
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          logger.error('send email to', targetUser, 'failed since:', error);
          eventproxy.emit((objPara.eventName||'emailSent'), {success: false});
          return;
      }
      eventproxy.emit((objPara.eventName||'emailSent'), {success: true});
      logger.info('Message from', config.email.senderName, 'to', targetUser, 'sent successfully');
    });
}
