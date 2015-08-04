///<reference path="../../typings/tsd.d.ts"/>

import chai = require('chai');
import dispatcher = require('./../../lib/events/event_dispatcher');
var expect = chai.expect;

describe('EventDispatcher', () => {
    it('should always return the same instance', () => {
        var emitterOne = dispatcher.EventDispatcher.getInstance();
        var emitterTwo = dispatcher.EventDispatcher.getInstance();

        expect(emitterTwo).to.eq(emitterOne);
    });

    it('should share events', () => {
        var emitterOne = dispatcher.EventDispatcher.getInstance();
        var emitterTwo = dispatcher.EventDispatcher.getInstance();

        var i = 0;

        emitterOne.on('foo', () => {
            i = 1;
        });

        emitterTwo.emit('foo');

        expect(i).to.eq(1);
    });
});
