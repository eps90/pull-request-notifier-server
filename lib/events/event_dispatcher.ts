import * as events from 'events';
import * as util from 'util';
import logger from './../logger';

const EventEmitter = events.EventEmitter;

export class EventDispatcher extends events.EventEmitter {
    private static instance: EventDispatcher;

    static getInstance(): EventDispatcher {
        if (this.instance === undefined) {
            logger.logNewEventDispatcherInstance();
        }
        return this.instance || (this.instance = new EventDispatcher());
    }
}

util.inherits(EventDispatcher, EventEmitter);
