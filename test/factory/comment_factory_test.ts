import {Comment} from '../../lib/model/comment';
import {expect} from 'chai';
import {CommentFactory} from "../../lib/factory/comment";


describe('Comment factory', () => {
    it('should create a comment object from raw object', () => {
        const rawPayload = {
            "id": 3,
            "content": {
                "raw": "abc",
                "html": "<b>abc</b>",
                "markup": "**abc**"
            },
            "links": {
                "self": {
                    "href": "http://example.com/self"
                },
                "html": {
                    "href": "http://example.com/html"
                }
            }
        };

        const expectedComment = new Comment();
        expectedComment.id = 3;
        expectedComment.content = {
            raw: 'abc',
            html: '<b>abc</b>',
            markup: '**abc**'
        };
        expectedComment.links = {
            self: {
                href: "http://example.com/self"
            },
            html: {
                href: "http://example.com/html"
            }
        };
        const actualComment = CommentFactory.create(rawPayload);

        expect(actualComment).to.deep.equal(expectedComment);
    });
});
