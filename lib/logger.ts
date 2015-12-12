///<reference path="../typings/tsd.d.ts"/>

import winston = require('winston');
require('winston-loggly');

// Unfortunately, these things cannot be in config because it will cause circular reference errors
var logglyToken = process.env['BBNOTIFIER_LOGGLY_TOKEN'];
var logglySubdomain = process.env['BBNOTIFIER_LOGGLY_SUBDOMAIN'];

var logger: winston.LoggerInstance = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.Loggly)({
            token: logglyToken,
            subdomain: logglySubdomain,
            tags: ["nodejs", "Bitbucket-Notifier"],
            json: true,
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ]
});

logger.cli();

export = logger;
