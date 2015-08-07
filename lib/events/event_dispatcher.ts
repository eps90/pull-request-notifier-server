///<reference path="../../typings/tsd.d.ts"/>

import events = require('events');
import util = require('util');
import logger = require('./../logger');

var EventEmitter = events.EventEmitter;

export class EventDispatcher extends events.EventEmitter {
    private static instance: EventDispatcher;

    static getInstance() {
        if (this.instance === undefined) {
            logger.info('Creating new instance of EventDispatcher');
        }
        return this.instance || (this.instance = new EventDispatcher);
    }
}

util.inherits(EventDispatcher, EventEmitter);