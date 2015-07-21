///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import factories = require('./../lib/factories');

describe('Factories', () => {
    describe('ProjectFactory', () => {
        it('should create Project model from given config', () => {
            var rawObject: any = {
                name: 'my_repo',
                full_name: 'org/my_repo',
                links: {
                    pullrequests: {
                        href: 'http://example.com'
                    }
                }
            };

            var projectFactory = new factories.ProjectFactory();
            var project = projectFactory.create(rawObject);

            expect(project.fullName).to.eq('org/my_repo');
            expect(project.name).to.eq('my_repo');
            expect(project.pullRequestsUrl).to.eq('http://example.com');
        });
    });

    describe('UserFactory', () => {
        it('should create User model from given config', () => {
            var rawObject: any = {
                username: 'john.kowalsky',
                display_name: 'John Kowalsky'
            };

            var userFactory = new factories.UserFactory();
            var user = userFactory.create(rawObject);

            expect(user.username).to.equal('john.kowalsky');
            expect(user.displayName).to.equal('John Kowalsky');
        });
    });

    describe('ReviewerFactory', () => {
        it('should create Reviewer model from given config', () => {
            var rawObject: any = {
                role: 'REVIEWER',
                user: {
                    username: 'john.smith',
                    display_name: 'John Smith'
                },
                approved: false
            };

            var reviewerFactory = new factories.ReviewerFactory();
            var reviewer = reviewerFactory.create(rawObject);

            expect(reviewer.approved).to.eq(false);
            expect(reviewer.user.displayName).to.eq('John Smith');
            expect(reviewer.user.username).to.eq('john.smith');
        });
    });
});
