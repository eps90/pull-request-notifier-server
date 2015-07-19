///<reference path="../typings/tsd.d.ts"/>

import models = require('./../lib/models');
import repositories = require('./../lib/repositories');
import nock = require('nock');
import chai = require('chai');
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

        it('should create list of projects by requesting them', (done) => {
            var config:any = {
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

            var configNextPage:any = {
                values: [
                    {
                        'name': 'another_repo',
                        'full_name': 'org/another_repo'
                    }
                ]
            };

            var thirdPage:any = {
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
            projectRepository.fetchAll((repos: Array<models.Repository>) => {
                expect(repos).to.have.length(3);
                var repository:models.Repository = repos[0];
                expect(repository).to.be.instanceOf(models.Repository);
                expect(repository.name).to.eq('my_repo');
                expect(repository.fullName).to.eq('org/my_repo');

                var anotherRepository:models.Repository = repos[1];
                expect(anotherRepository).to.be.instanceOf(models.Repository);
                expect(anotherRepository.name).to.eq('another_repo');
                expect(anotherRepository.fullName).to.eq('org/another_repo');

                var thirdRepository:models.Repository = repos[2];
                expect(thirdRepository).to.be.instanceOf(models.Repository);
                expect(thirdRepository.name).to.eq('aaaa');
                expect(thirdRepository.fullName).to.eq('bbbb');

                expect(repositories.ProjectRepository.repositories).to.eq(repos);

                done();
            });
        });

        it('should find all known repositories', (done) => {
            var projects = [new models.Repository({name: 'a'}), new models.Repository({name: 'b'})];
            repositories.ProjectRepository.repositories = projects;
            var projectRepos = new repositories.ProjectRepository(appConfig);
            projectRepos.findAll((foundRepos) => {
                expect(foundRepos).to.equal(projects);
                done();
            });

        });
    });

    describe("PullRequestRepository", () => {
        beforeEach(() => {
            repositories.PullRequestRepository.pullRequests = {};
        });

        it('should create list of pull requests by requesting them', (done) => {
            var pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';
            var projectConfig = {
                links: {
                    pullrequests: {
                        href: pullRequestsUrl
                    }
                },
                full_name: 'bitbucket/bitbucket'
            };
            var project = new models.Repository(projectConfig);

            var pullRequests:any = {
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

            var secondPrs:any = {
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
                .reply(200, JSON.stringify(pullRequests));
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .query({page: '2'})
                .reply(200, JSON.stringify(secondPrs));

            var pullRequestRepository = new repositories.PullRequestRepository();
            pullRequestRepository.fetchByRepository(project, (prs: Array<models.PullRequest>) => {
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

        it('should find all known pull requests', (done) => {
            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                new models.PullRequest({title: 'Some title'}),
                new models.PullRequest({title: 'another title'})
            ];
            var pullRequestRepository = new repositories.PullRequestRepository();
            var pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';
            var projectConfig = {
                links: {
                    pullrequests: {
                        href: pullRequestsUrl
                    }
                }
            };
            var project = new models.Repository(projectConfig);

            pullRequestRepository.findAll((pullRequests:Array<models.PullRequest>) => {
                expect(pullRequests).to.have.length(2);
                expect(pullRequests[0].title).to.eq('Some title');
                done();
            });
        });

        it('should find all known pull requests even if they are from different repositories', (done) => {
            repositories.PullRequestRepository.pullRequests['aaa/bbb'] = [
                new models.PullRequest({title: 'Some title'}),
                new models.PullRequest({title: 'Another title'})
            ];

            repositories.PullRequestRepository.pullRequests['ccc/ddd'] = [
                new models.PullRequest({title: 'Different repository'}),
                new models.PullRequest({title: 'Still diffferent repository'})
            ];

            var prRepository = new repositories.PullRequestRepository();
            prRepository.findAll((prs:Array<models.PullRequest>) => {
                expect(prs).to.have.length(4);
                done();
            });
        });

        it('should find pull requests assigned to user by its username', (done) => {
            var wantedReviewer = {
                role: 'REVIEWER',
                user: {
                    username: 'john.smith'
                },
                approved: true
            };

            var anotherReviewer = {
                role: 'REVIEWER',
                user: {
                    username: 'anna.kowalsky',
                    approved: false
                }
            };

            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                new models.PullRequest({participants: [wantedReviewer]}),
                new models.PullRequest({participants: [anotherReviewer]})
            ];
            var prRepo = new repositories.PullRequestRepository();


            prRepo.findByReviewer('john.smith', (pullRequests: Array<models.PullRequest>) => {
                expect(pullRequests).to.have.length(1);
                expect(pullRequests[0].reviewers[0].user.username).to.eq('john.smith');
                done();
            });
        });

        it('should find pull requests by their author', (done) => {
            var wantedAuthor = {
                author: {
                    username: 'john.smith'
                }
            };

            var unwantedAuthor = {
                author: {
                    username: 'anna.kowalsky'
                }
            };

            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                new models.PullRequest(wantedAuthor),
                new models.PullRequest(unwantedAuthor)
            ];
            var prRepo = new repositories.PullRequestRepository();

            prRepo.findByAuthor('john.smith', (pullRequests:Array<models.PullRequest>) => {
                expect(pullRequests).to.have.length(1);
                expect(pullRequests[0].author.username).to.eq('john.smith');
                done();
            });
        });
    });
});
