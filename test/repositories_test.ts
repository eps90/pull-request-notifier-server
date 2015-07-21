///<reference path="../typings/tsd.d.ts"/>
///<reference path="../custom_typings/nock.d.ts"/>

import models = require('./../lib/models');
import repositories = require('./../lib/repositories');
import nock = require('nock');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

var expect = chai.expect;

describe("Repositories", () => {
    var appConfig = {
        baseUrl: 'http://example.com',
        teamName: 'bitbucket',
        user: 'my.user',
        password: 'topsecret'
    };

    describe("ProjectRepository", () => {
        beforeEach(() => {
            repositories.ProjectRepository.repositories = [];
        });

        afterEach(() => {
            nock.cleanAll();
        });

        it('should create list of projects by requesting them', (done) => {
            var config: any = {
                size: 29,
                pagelen: 10,
                next: 'http://example.com/repositories/bitbucket?page=2',
                values: [
                    {
                        'name': 'my_repo',
                        'full_name': 'org/my_repo'
                    }
                ]
            };

            var configNextPage: any = {
                values: [
                    {
                        'name': 'another_repo',
                        'full_name': 'org/another_repo'
                    }
                ]
            };

            var thirdPage: any = {
                values: [
                    {
                        'name': 'aaaa',
                        'full_name': 'bbbb'
                    }
                ]
            };

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .reply(200, JSON.stringify(config));

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '2'})
                .reply(200, JSON.stringify(configNextPage));

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '3'})
                .reply(200, JSON.stringify(thirdPage));

            var projectRepository = new repositories.ProjectRepository(appConfig);

            projectRepository.fetchAll().then((repos: Array<models.Project>) => {
                expect(repos).to.have.length(3);
                var repository: models.Project = repos[0];
                expect(repository).to.be.instanceOf(models.Project);
                expect(repository.name).to.eq('my_repo');
                expect(repository.fullName).to.eq('org/my_repo');

                var anotherRepository: models.Project = repos[1];
                expect(anotherRepository).to.be.instanceOf(models.Project);
                expect(anotherRepository.name).to.eq('another_repo');
                expect(anotherRepository.fullName).to.eq('org/another_repo');

                var thirdRepository: models.Project = repos[2];
                expect(thirdRepository).to.be.instanceOf(models.Project);
                expect(thirdRepository.name).to.eq('aaaa');
                expect(thirdRepository.fullName).to.eq('bbbb');

                expect(repositories.ProjectRepository.repositories).to.eq(repos);

                done();
            });
        });

        it('should throw an error when request has failed', () => {
            nock('http://example.com')
                .get('/repositories/bitbucket')
                .replyWithError('something wrong happened');

            var projectRepository = new repositories.ProjectRepository(appConfig);
            expect(projectRepository.fetchAll()).to.be.rejectedWith(Error);
        });

        it('should throw an error when request has returned non-successful response code', () => {
            nock('http://example.com')
                .get('/repositories/bitbucket')
                .reply(403, 'Forbidden');

            var projectRepository = new repositories.ProjectRepository(appConfig);
            expect(projectRepository.fetchAll()).to.be.rejectedWith(Error);
        });

        it('should find all known repositories', () => {
            var projects = [new models.Project(), new models.Project()];
            repositories.ProjectRepository.repositories = projects;
            var projectRepos = new repositories.ProjectRepository(appConfig);
            var foundRepos = projectRepos.findAll();
            expect(foundRepos).to.equal(projects);
        });
    });

    describe("PullRequestRepository", () => {
        beforeEach(() => {
            repositories.PullRequestRepository.pullRequests = {};
        });

        afterEach(() => {
            nock.cleanAll();
        });

        it('should fetch open pull requests by requesting for them', (done) => {
            var project = new models.Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            var pullRequests: any = {
                size: 19,
                pagelen: 10,
                next: 'http://example.com/bitbucket/bitbucket/pullrequests?page=2',
                values: [
                    {
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
                                role: 'REVIEWER',
                                user: {
                                    username: 'jon.snow',
                                    display_name: 'Jon Snow'
                                },
                                approved: true
                            }
                        ],
                        state: 'OPEN'
                    }
                ]
            };

            var secondPrs: any = {
                values: [
                    {
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
                                role: 'REVIEWER',
                                user: {
                                    username: 'jon.snow',
                                    display_name: 'Jon Snow'
                                },
                                approved: true
                            }
                        ],
                        state: 'OPEN'
                    }
                ]
            };

            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .query({state: 'OPEN'})
                .reply(200, JSON.stringify(pullRequests));
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .query({page: '2', state: 'OPEN'})
                .reply(200, JSON.stringify(secondPrs));

            var pullRequestRepository = new repositories.PullRequestRepository(appConfig);
            pullRequestRepository.fetchByRepository(project).then((prs: Array<models.PullRequest>) => {
                expect(prs).to.have.length(2);
                var pullRequest = prs[0];
                expect(pullRequest).to.be.instanceOf(models.PullRequest);
                expect(pullRequest.author).to.be.instanceOf(models.User);
                expect(pullRequest.state).to.eq(models.PullRequestState.Open);
                expect(pullRequest.reviewers).to.be.lengthOf(1);

                expect(repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket']).to.eq(prs);

                done();
            });
        });

        it('should throw an error when request has failed', () => {
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .replyWithError('something wrong happened');

            var project = new models.Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            var pullRequestRepository = new repositories.PullRequestRepository(appConfig);
            expect(pullRequestRepository.fetchByRepository(project)).to.be.rejectedWith(Error);
        });

        it('should throw an error when authorization data is incorrect', () => {
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .reply(403, 'Forbidden');

            var project = new models.Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            var pullRequestRepository = new repositories.PullRequestRepository(appConfig);
            expect(pullRequestRepository.fetchByRepository(project)).to.be.rejectedWith(Error);
        });

        it('should find all known pull requests', () => {
            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                new models.PullRequest(),
                new models.PullRequest()
            ];
            var pullRequestRepository = new repositories.PullRequestRepository(appConfig);

            var pullRequests = pullRequestRepository.findAll();
            expect(pullRequests).to.have.length(2);
        });

        it('should find all known pull requests even if they are from different repositories', () => {
            repositories.PullRequestRepository.pullRequests['aaa/bbb'] = [
                new models.PullRequest(),
                new models.PullRequest()
            ];

            repositories.PullRequestRepository.pullRequests['ccc/ddd'] = [
                new models.PullRequest(),
                new models.PullRequest()
            ];

            var prRepository = new repositories.PullRequestRepository(appConfig);
            var prs = prRepository.findAll();
            expect(prs).to.have.length(4);
        });

        it('should find pull requests assigned to user by its username', () => {
            var userOne = new models.User();
            userOne.username = 'john.smith';

            var userTwo = new models.User();
            userTwo.username = 'anna.kowalsky';

            var reviewerOne = new models.Reviewer();
            reviewerOne.user = userOne;

            var reviewerTwo = new models.Reviewer();
            reviewerTwo.user = userTwo;

            var prOne = new models.PullRequest();
            prOne.reviewers.push(reviewerOne);

            var prTwo = new models.PullRequest();
            prTwo.reviewers.push(reviewerTwo);

            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];
            var prRepo = new repositories.PullRequestRepository(appConfig);


            var pullRequests = prRepo.findByReviewer('john.smith');
            expect(pullRequests).to.have.length(1);
            // @todo To equal?
            expect(pullRequests[0].reviewers[0].user.username).to.eq('john.smith');
        });

        it('should find pull requests by their author', () => {
            var authorOne = new models.User();
            authorOne.username = 'john.smith';

            var authorTwo = new models.User();
            authorTwo.username = 'anna.kowalsky';

            var prOne = new models.PullRequest();
            prOne.author = authorOne;

            var prTwo = new models.PullRequest();
            prTwo.author = authorTwo;

            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];
            var prRepo = new repositories.PullRequestRepository(appConfig);

            var pullRequests = prRepo.findByAuthor('john.smith');
            expect(pullRequests).to.have.length(1);
            // @todo To equal?
            expect(pullRequests[0].author.username).to.eq('john.smith');
        });

        it('should allow to add new pull request', () => {
            var project = new models.Project();
            project.fullName = 'aaa/bbb';

            var pullRequest = new models.PullRequest();
            pullRequest.title = 'This is some title';
            pullRequest.targetRepository = project;

            var prRepository = new repositories.PullRequestRepository(appConfig);
            prRepository.add(pullRequest);

            var actualPullRequests: Array<models.PullRequest> = prRepository.findAll();
            expect(actualPullRequests).to.have.length(1);

            // @todo to equal?
            expect(actualPullRequests[0].title).to.eq('This is some title');
            expect(repositories.PullRequestRepository.pullRequests['aaa/bbb'][0].title)
                .to.eq('This is some title');
        });
    });
});
