///<reference path="../typings/tsd.d.ts"/>

import winston = require('winston');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)()
    ]
});

export = logger;
