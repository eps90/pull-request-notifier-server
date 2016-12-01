import * as chai from 'chai';
import {EventDispatcher} from './../../lib/events/event_dispatcher';
var expect = chai.expect;

describe('EventDispatcher', () => {
    it('should always return the same instance', () => {
        var emitterOne = EventDispatcher.getInstance();
        var emitterTwo = EventDispatcher.getInstance();

        expect(emitterTwo).to.eq(emitterOne);
    });

    it('should share events', () => {
        var emitterOne = EventDispatcher.getInstance();
        var emitterTwo = EventDispatcher.getInstance();

        var i = 0;

        emitterOne.on('foo', () => {
            i = 1;
        });

        emitterTwo.emit('foo');

        expect(i).to.eq(1);
    });
});
