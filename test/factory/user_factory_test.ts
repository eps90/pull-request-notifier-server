import {UserFactory} from "../../lib/factory/user";
import {expect} from 'chai';

describe('User factory', () => {
    it('should create User model from given config', () => {
        const rawObject: any = {
            uuid: '{6619b7f6-bce9-4e3b-9814-4bc407ffb505}',
            username: 'john.kowalsky',
            display_name: 'John Kowalsky'
        };

        const user = UserFactory.create(rawObject);

        expect(user.uuid).to.eq('{6619b7f6-bce9-4e3b-9814-4bc407ffb505}');
        expect(user.username).to.equal('john.kowalsky');
        expect(user.displayName).to.equal('John Kowalsky');
    });
});
