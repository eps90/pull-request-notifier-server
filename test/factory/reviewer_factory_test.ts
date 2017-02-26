import {ReviewerFactory} from "../../lib/factory/reviewer";
import {expect} from 'chai';

describe('ReviewerFactory', () => {
    it('should create Reviewer model from given config', () => {
        const rawObject: any = {
            role: 'REVIEWER',
            user: {
                username: 'john.smith',
                display_name: 'John Smith'
            },
            approved: false
        };

        const reviewer = ReviewerFactory.create(rawObject);

        expect(reviewer.approved).to.eq(false);
        expect(reviewer.user.displayName).to.eq('John Smith');
        expect(reviewer.user.username).to.eq('john.smith');
    });
});
