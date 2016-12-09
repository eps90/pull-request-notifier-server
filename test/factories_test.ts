import * as chai from 'chai';
import {
    ProjectFactory, UserFactory, ReviewerFactory, PullRequestFactory,
    PullRequestLinksFactory
} from '../lib/factory';
import {PullRequestState} from '../lib/model';
var expect = chai.expect;

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

            var project = ProjectFactory.create(rawObject);

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

            var user = UserFactory.create(rawObject);

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

            var reviewer = ReviewerFactory.create(rawObject);

            expect(reviewer.approved).to.eq(false);
            expect(reviewer.user.displayName).to.eq('John Smith');
            expect(reviewer.user.username).to.eq('john.smith');
        });
    });

    describe('PullRequestFactory', () => {
        it('should create PullRequests model from given object', () => {
            var rawObject: any = {
                id: 1,
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

            var pullRequest = PullRequestFactory.create(rawObject);

            expect(pullRequest.id).to.eq(1);
            expect(pullRequest.title).to.equal('Fixed bugs');
            expect(pullRequest.description).to.eq('This is a special pull request');
            expect(pullRequest.targetRepository.fullName).to.eq('bitbucket/bitbucket');
            expect(pullRequest.targetRepository.name).to.eq('bitbucket');
            expect(pullRequest.targetBranch).to.eq('master');
            expect(pullRequest.state).to.eq(PullRequestState.Open);
            expect(pullRequest.author.displayName).to.eq('John Smith');
            expect(pullRequest.author.username).to.eq('john.smith');

            expect(pullRequest.reviewers).to.be.lengthOf(1);
            expect(pullRequest.reviewers[0].user.username).to.eq('jon.snow');
            expect(pullRequest.reviewers[0].user.displayName).to.eq('Jon Snow');
            expect(pullRequest.reviewers[0].approved).to.eq(true);
        });

        it('should assign links to pull request', () => {
            var rawObject: any = {
                links: {
                    self: {
                        href: 'http://example.com/pullrequest/1'
                    }
                }
            };

            var pullRequest = PullRequestFactory.create(rawObject);
            expect(pullRequest.links.self).to.eq('http://example.com/pullrequest/1');
        });
    });

    describe('PullRequestLinksFactory', () => {
        it('should create PullRequestLinks model from given object', () => {
            var rawObject = {
                self: {
                    href: "http://example.com/aaa/bbb"
                },
                html: {
                    href: "http://example.com/ccc/ddd"
                }
            };

            var prLinks = PullRequestLinksFactory.create(rawObject);
            expect(prLinks.self).to.eq('http://example.com/aaa/bbb');
            expect(prLinks.html).to.eq('http://example.com/ccc/ddd');
        });
    });
});
