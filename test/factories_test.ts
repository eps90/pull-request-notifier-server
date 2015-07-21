///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import factories = require('./../lib/factories');
import models = require('./../lib/models');

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

    describe('PullRequestFactory', () => {
        it('should create PullRequests model from given object', () => {
            var rawObject: any = {
                author: {
                    username: 'john.smith',
                    display_name: 'John Smith'
                },
                source: {
                    branch: {
                        name: 'next'
                    }
                },
                destination: {
                    repository: {
                        full_name: 'bitbucket/bitbucket',
                        name: 'bitbucket'
                    },
                    branch: {
                        name: 'master'
                    }
                },
                title: 'Fixed bugs',
                description: 'This is a special pull request',
                participants: [
                    {
                        role: 'PARTICIPANT',
                        user: {
                            username: 'anna.kowalsky',
                            display_name: 'Anna Kowalsky'
                        },
                        approved: false
                    },
                    {
                        role: 'REVIEWER',
                        user: {
                            username: 'jon.snow',
                            display_name: 'Jon Snow'
                        },
                        approved: true
                    }
                ],
                state: 'OPEN'
            };

            var prFactory = new factories.PullRequestFactory();
            var pullRequest = prFactory.create(rawObject);

            expect(pullRequest.title).to.equal('Fixed bugs');
            expect(pullRequest.description).to.eq('This is a special pull request');
            expect(pullRequest.targetRepository.fullName).to.eq('bitbucket/bitbucket');
            expect(pullRequest.targetRepository.name).to.eq('bitbucket');
            expect(pullRequest.targetBranch).to.eq('master');
            expect(pullRequest.state).to.eq(models.PullRequestState.Open);
            expect(pullRequest.author.displayName).to.eq('John Smith');
            expect(pullRequest.author.username).to.eq('john.smith');

            expect(pullRequest.reviewers).to.be.lengthOf(1);
            expect(pullRequest.reviewers[0].user.username).to.eq('jon.snow');
            expect(pullRequest.reviewers[0].user.displayName).to.eq('Jon Snow');
            expect(pullRequest.reviewers[0].approved).to.eq(true);
        });
    });
});
