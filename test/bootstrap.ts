///<reference path="../typings/tsd.d.ts"/>

import logger = require('./../lib/logger');
import winston = require('winston');

logger.remove(winston.transports.Console);
logger.remove(winston.transports.Loggly);
