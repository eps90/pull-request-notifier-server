/// <reference path="../typings/tsd.d.ts" />

import models = require('./../lib/models');
import chai = require('chai');
var expect = chai.expect;

describe('Models', () => {
    describe('Repository', () => {
        it('should be created from object', () => {
            var config:any = {
                'name': 'my_repo',
                'full_name': 'org/my_repo'
            };

            var repository = new models.Repository(config);
            expect(repository.name).to.equal('my_repo');
            expect(repository.fullName).to.equal('org/my_repo');
        });
    });

    describe("User", () => {
        it('should be created from object', () => {
            var config:any = {
                username: 'john.kowalsky',
                display_name: 'John Kowalsky'
            };

            var user = new models.User(config);
            expect(user.username).to.equal('john.kowalsky');
            expect(user.displayName).to.equal('John Kowalsky')
        });
    })
});
