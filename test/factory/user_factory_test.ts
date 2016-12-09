import {UserFactory} from "../../lib/factory/user";
import {expect} from 'chai';

describe('User factory', () => {
    it('should create User model from given config', () => {
        const rawObject: any = {
            username: 'john.kowalsky',
            display_name: 'John Kowalsky'
        };

        const user = UserFactory.create(rawObject);

        expect(user.username).to.equal('john.kowalsky');
        expect(user.displayName).to.equal('John Kowalsky');
    });
});
