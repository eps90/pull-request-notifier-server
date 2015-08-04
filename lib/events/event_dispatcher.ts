///<reference path="../../typings/tsd.d.ts"/>

import events = require('events');
import util = require('util');

var EventEmitter = events.EventEmitter;

export class EventDispatcher extends events.EventEmitter {
    private static instance: EventDispatcher;

    static getInstance() {
        return this.instance || (this.instance = new EventDispatcher);
    }
}

util.inherits(EventDispatcher, EventEmitter);
