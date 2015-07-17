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
    });

    describe("Reviewer", () => {
        it('should be created from object', () => {
            var config:any = {
                role: 'REVIEWER',
                user: {
                    username: 'john.smith',
                    display_name: 'John Smith'
                },
                approved: false
            };

            var reviewer = new models.Reviewer(config);
            expect(reviewer.approved).to.eq(false);
            expect(reviewer.user.displayName).to.eq('John Smith');
            expect(reviewer.user.username).to.eq('john.smith');
        });
    });

    describe("PullRequest", () => {
        it('should be created from object', () => {
            var config:any = {
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

            var pullRequest = new models.PullRequest(config);
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
