import logger from './../lib/logger';
import winston = require('winston');

logger.getLogger().remove(winston.transports.Console);
logger.getLogger().remove(winston.transports.Loggly);

require('source-map-support').install();
