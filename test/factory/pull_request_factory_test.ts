import {PullRequestFactory} from "../../lib/factory/pull_request";
import {PullRequestState} from "../../lib/model/pull_request_state";
import {expect} from 'chai';

describe('PullRequestFactory', () => {
    it('should create PullRequests model from given object', () => {
        const rawObject: any = {
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

        const pullRequest = PullRequestFactory.create(rawObject);

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
        const rawObject: any = {
            links: {
                self: {
                    href: 'http://example.com/pullrequest/1'
                }
            }
        };

        const pullRequest = PullRequestFactory.create(rawObject);
        expect(pullRequest.links.self).to.eq('http://example.com/pullrequest/1');
    });
});
