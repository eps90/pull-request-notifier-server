///<reference path="../typings/tsd.d.ts"/>

import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
import nock = require('nock');

import fetcher = require('./../lib/fetcher');
import repositories = require('./../lib/repositories');
import configModule = require('./../lib/config');

// @todo If possible, mock repositories to prevent mocking http resposes (in TS is quite difficult...)
describe('Fetcher', () => {
    var appConfig = {
        baseUrl: 'http://example.com',
        teamName: 'bitbucket',
        user: 'my.user',
        password: 'topsecret'
    };

    var basicAuth = {
        user: 'my.user',
        pass: 'topsecret'
    };

    before(() => {
        configModule.Config.setUp({config: appConfig});
    });

    after(() => {
        configModule.Config.reset();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('should initialize pull requests', (done) => {
        var projects = {
            size: 1,
            pagelen: 10,
            next: 'http://example.com/repositories/bitbucket?page=2',
            values: [
                {
                    'name': 'my_repo',
                    'full_name': 'org/my_repo',
                    'links': {
                        pullrequests: {
                            href: 'http://example.com/repositories/bitbucket/bitbucket/pullrequests'
                        }
                    }
                }
            ]
        };

        var pullRequests = {
            values: [
                {
                    links: {
                        self: {
                            href: 'http://example.com/repositories/bitbucket/bitbucket/pullrequests/1'
                        }
                    },
                    title: 'Pull request one'
                },
                {
                    links: {
                        self: {
                            href: 'http://example.com/repositories/bitbucket/bitbucket/pullrequests/2'
                        }
                    },
                    title: 'Pull request two'
                }
            ]
        };

        var pullRequestOne = {
            title: 'Pull request one'
        };

        var pullRequestTwo = {
            title: 'Pull request two'
        };

        nock('http://example.com')
            .get('/repositories/bitbucket')
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(projects));
        nock('http://example.com')
            .get('/repositories/bitbucket/bitbucket/pullrequests')
            .query({state: 'OPEN'})
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(pullRequests));
        nock('http://example.com')
            .get('/repositories/bitbucket/bitbucket/pullrequests/1')
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(pullRequestOne));
        nock('http://example.com')
            .get('/repositories/bitbucket/bitbucket/pullrequests/2')
            .basicAuth(basicAuth)
            .reply(200, JSON.stringify(pullRequestTwo));

        fetcher.Fetcher.initPullRequestCollection().then(() => {
            var pullRequests = repositories.PullRequestRepository.findAll();
            expect(pullRequests).to.have.length(2);
            expect(pullRequests[0].title).to.eq('Pull request one');
            expect(pullRequests[1].title).to.eq('Pull request two');

            done();
        }).catch((error) => {
            done(error);
        })
    });
});
