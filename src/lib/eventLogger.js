var EventLog = require("./../model/eventLog.js");

// Load configuration file
var config = require("../config.js");


var mail_transport = false;
if (config.mail_notifications_enabled) {
    mail_transport= require("nodemailer").createTransport({
        host: config.mail_smtp_server,
        secure: true, //disable SSL
        requireTLS: true, //Force TLS
        tls: {
            rejectUnauthorized: false
        },
        // port: port, //Port of STMP service
        auth: {
            user: config.mail_username,
            pass: config.mail_password
        }
    });
}

// Save event to db and optionally reports it via mail
function logEvent(description, emailNotify) {
    var eventLog = new EventLog({
        description: description
    });
    eventLog.save();

    // Send event log via email
    if (emailNotify && config.mail_notifications_enabled) {
        var mailOptions = {
            from: "'Polievac' <" + config.mail_username + ">",
            to: config.mail_notification_address,
            subject: "Polievac notification",
            text: description
        };

        console.log("Sending mail");
        mail_transport.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                return;
            }
            console.log('Message sent: ' + info.response);
        });
    }
}

// Gets n last event logs
function getEventLogs(callback, n) {
    EventLog
        .find()
        .sort({"timestamp": -1})
        .limit(n || 10)
        .exec(callback);
}

module.exports.logEvent = logEvent;
module.exports.getEventLogs = getEventLogs;

