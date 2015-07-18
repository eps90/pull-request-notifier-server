///<reference path="../typings/tsd.d.ts"/>

import models = require('./../lib/models');
import repositories = require('./../lib/repositories');
import nock = require('nock');
import chai = require('chai');
var expect = chai.expect;

describe("Repositories", () => {
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

            var projectRepository = new repositories.ProjectRepository('http://example.com', 'bitbucket');
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
            var projectRepos = new repositories.ProjectRepository('http://example.com', 'bitbucket');
            projectRepos.findAll((foundRepos) => {
                expect(foundRepos).to.equal(projects);
                done();
            });

        });

        it('should fetch all repos if they are not fetched yet', (done) => {
            var response:any = {
                values: [
                    {
                        'name': 'my_repo',
                        'full_name': 'org/my_repo'
                    }
                ]
            };

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .reply(200, JSON.stringify(response));

            var projectRepos = new repositories.ProjectRepository('http://example.com', 'bitbucket');
            projectRepos.findAll((foundRepos) => {
                expect(foundRepos).to.have.length(1);
                expect(foundRepos[0].fullName).to.eq('org/my_repo');
                done();
            });
        });
    });

    describe("PullRequestRepository", () => {
        it('should create list of pull requests by requesting them', (done) => {
            var pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';
            var projectConfig = {
                links: {
                    pullrequests: {
                        href: pullRequestsUrl
                    }
                }
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

                expect(repositories.PullRequestRepository.pullRequests).to.eq(prs);

                done();
            });
        });
    });
});
