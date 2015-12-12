///<reference path="../typings/tsd.d.ts"/>

import winston = require('winston');
/* tslint:disable */
require('winston-loggly');
/* tslint:enable */

// unfortunately, these things cannot be in config because it will cause circular reference errors

var tokenEnvKey = 'BBNOTIFIER_LOGGLY_TOKEN';
var subdomainEnvKey = 'BBNOTIFIER_LOGGLY_SUBDOMAIN';
var logglyToken = process.env[tokenEnvKey];
var logglySubdomain = process.env[subdomainEnvKey];

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
