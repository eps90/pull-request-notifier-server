///<reference path="../typings/index.d.ts"/>

import logger = require('./../lib/logger');
import winston = require('winston');

logger.getLogger().remove(winston.transports.Console);
logger.getLogger().remove(winston.transports.Loggly);
