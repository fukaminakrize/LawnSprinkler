// todo implement

var winston = require("winston");
//winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: function() {
                return new Date();
            },
            colorize: true
        })
    ]
});

module.exports = logger;