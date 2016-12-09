import {PullRequestLinksFactory} from "../../lib/factory/pull_request_links";
import {expect} from 'chai';

describe('PullRequestLinksFactory', () => {
    it('should create PullRequestLinks model from given object', () => {
        const rawObject = {
            self: {
                href: "http://example.com/aaa/bbb"
            },
            html: {
                href: "http://example.com/ccc/ddd"
            }
        };

        const prLinks = PullRequestLinksFactory.create(rawObject);
        expect(prLinks.self).to.eq('http://example.com/aaa/bbb');
        expect(prLinks.html).to.eq('http://example.com/ccc/ddd');
    });
});
