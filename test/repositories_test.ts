///<reference path="../typings/tsd.d.ts"/>
///<reference path="../custom_typings/nock.d.ts"/>

import models = require('./../lib/models');
import repositories = require('./../lib/repositories');
import nock = require('nock');
import chai = require('chai');
import chaiAsPromised = require('chai-as-promised');
import configModule = require('./../lib/config');

chai.use(chaiAsPromised);

var expect = chai.expect;

describe("Repositories", () => {
    before(() => {
        var appConfig = {
            baseUrl: 'http://example.com',
            teamName: 'bitbucket',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        configModule.Config.setUp({config: appConfig});
    });

    after(() => {
        configModule.Config.reset();
    });

    var basicAuth = {
        user: 'my.user',
        pass: 'topsecret'
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
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(config));

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '2'})
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(configNextPage));

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '3'})
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(thirdPage));

            repositories.ProjectRepository.fetchAll()
                .then((repos: Array<models.Project>) => {
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
                })
                .catch((error) => {
                    done(error);
                });
        });

        it('should throw an error when request has failed', (done) => {
            nock('http://example.com')
                .get('/repositories/bitbucket')
                .basicAuth(basicAuth)
                .replyWithError('something wrong happened');

            expect(repositories.ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should thrown an error when one of subrequests failed', (done) => {
            var config: any = {
                size: 19,
                pagelen: 10,
                next: 'http://example.com/repositories/bitbucket?page=2',
                values: [
                    {
                        'name': 'my_repo',
                        'full_name': 'org/my_repo'
                    }
                ]
            };

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .basicAuth(basicAuth)
                .reply(200, config);

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '2'})
                .basicAuth(basicAuth)
                .replyWithError('something wrong happened');

            expect(repositories.ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should throw an error when request has returned non-successful response code', (done) => {
            nock('http://example.com')
                .get('/repositories/bitbucket')
                .basicAuth(basicAuth)
                .reply(403, 'Forbidden');

            expect(repositories.ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should throw an error when on of subrequests has return non-successful response code', (done) => {
            var config: any = {
                size: 19,
                pagelen: 10,
                next: 'http://example.com/repositories/bitbucket?page=2',
                values: [
                    {
                        'name': 'my_repo',
                        'full_name': 'org/my_repo'
                    }
                ]
            };

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .basicAuth(basicAuth)
                .reply(200, config);

            nock('http://example.com')
                .get('/repositories/bitbucket')
                .query({page: '2'})
                .basicAuth(basicAuth)
                .reply(400, 'something went wrong');

            expect(repositories.ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should find all known repositories', () => {
            var projects = [new models.Project(), new models.Project()];
            repositories.ProjectRepository.repositories = projects;
            var foundRepos = repositories.ProjectRepository.findAll();
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
                        links: {
                            self: {
                                href: 'http://example.com/bitbucket/bitbucket/pullrequests/1'
                            }
                        }
                    }
                ]
            };

            var pullRequestOne = {
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
                state: 'OPEN',
                links: {
                    self: {
                        href: 'http://example.com/bitbucket/bitbucket/pullrequests/1'
                    }
                }
            };

            var secondPrs: any = {
                values: [
                    {
                        links: {
                            self: {
                                href: 'http://example.com/bitbucket/bitbucket/pullrequests/2'
                            }
                        }
                    }
                ]
            };

            var pullRequestTwo = {
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
                state: 'OPEN',
                links: {
                    self: {
                        href: 'http://example.com/bitbucket/bitbucket/pullrequests/2'
                    }
                }
            };

            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .query({state: 'OPEN'})
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(pullRequests));
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .query({page: '2', state: 'OPEN'})
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(secondPrs));

            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(pullRequestOne));
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests/2')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(pullRequestTwo));

            repositories.PullRequestRepository.fetchByProject(project).then((prs: Array<models.PullRequest>) => {
                expect(prs).to.have.length(2);
                var pullRequest = prs[0];
                expect(pullRequest).to.be.instanceOf(models.PullRequest);
                expect(pullRequest.author).to.be.instanceOf(models.User);
                expect(pullRequest.state).to.eq(models.PullRequestState.Open);
                expect(pullRequest.reviewers).to.be.lengthOf(1);

                expect(repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket']).to.eq(prs);

                done();
            }).catch((error) => {
                done(error);
            });
        });

        it('should throw an error when request has failed', (done) => {
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .basicAuth(basicAuth)
                .replyWithError('something wrong happened');

            var project = new models.Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            expect(repositories.PullRequestRepository.fetchByProject(project)).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should throw an error when authorization data is incorrect', (done) => {
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .basicAuth(basicAuth)
                .reply(403, 'Forbidden');

            var project = new models.Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            expect(repositories.PullRequestRepository.fetchByProject(project)).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should fetch single pull request by its project and id', (done) => {
            var pullRequestId = 1;
            var project = new models.Project();
            project.fullName = 'bitbucket/bitbucket';

            var prEncoded = {
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
                        role: 'REVIEWER',
                        user: {
                            username: 'jon.snow',
                            display_name: 'Jon Snow'
                        },
                        approved: true
                    }
                ],
                state: 'OPEN',
                links: {
                    self: {
                        href: 'http://example.com/bitbucket/bitbucket/pullrequests/2'
                    }
                }
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            repositories.PullRequestRepository.fetchOne(project, pullRequestId).then((pr: models.PullRequest) => {
                expect(pr.id).to.eq(pullRequestId);
                done();
            }).catch((e) => {
                done(e);
            });
        });

        it('should fetch single pull request by prepared link', (done) => {
            var prEncoded = {
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
                        role: 'REVIEWER',
                        user: {
                            username: 'jon.snow',
                            display_name: 'Jon Snow'
                        },
                        approved: true
                    }
                ],
                state: 'OPEN',
                links: {
                    self: {
                        href: 'http://example.com/repositories/bitbucket/bitbucket/pullrequests/1'
                    }
                }
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            repositories.PullRequestRepository.fetchOne('http://example.com/repositories/bitbucket/bitbucket/pullrequests/1')
                .then((pr: models.PullRequest) => {
                    expect(pr.id).to.eq(1);
                    expect(pr.title).to.eq('Fixed bugs');
                    done();
                }).catch((e) => {
                    done(e);
                });
        });

        it('should find all known pull requests', () => {
            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                new models.PullRequest(),
                new models.PullRequest()
            ];

            var pullRequests = repositories.PullRequestRepository.findAll();
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

            var prs = repositories.PullRequestRepository.findAll();
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

            var pullRequests = repositories.PullRequestRepository.findByReviewer('john.smith');
            expect(pullRequests).to.have.length(1);
            expect(pullRequests[0].reviewers[0].user).to.eq(userOne);
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

            var pullRequests = repositories.PullRequestRepository.findByAuthor('john.smith');
            expect(pullRequests).to.have.length(1);
            expect(pullRequests[0].author).to.eq(authorOne);
        });

        it('should find all pull requests belonging to user (assigned and authored)', () => {
            var authorOne = new models.User();
            authorOne.username = 'john.smith';

            var authorTwo = new models.User();
            authorTwo.username = 'anna.kowalsky';

            var authorAsReviewer = new models.Reviewer();
            authorAsReviewer.user = authorOne;
            authorAsReviewer.approved = true;

            var project = new models.Project();
            project.fullName = 'team_name/repo_name';

            var prOne = new models.PullRequest();
            prOne.id = 1;
            prOne.targetRepository = project;
            prOne.author = authorOne;

            var prTwo = new models.PullRequest();
            prTwo.id = 2;
            prTwo.author = authorTwo;
            prTwo.targetRepository = project;
            prTwo.reviewers.push(authorAsReviewer);

            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];

            var pullRequests = repositories.PullRequestRepository.findByUser('john.smith');
            expect(pullRequests).to.have.length(2);
            expect(pullRequests[0].author.username).to.eq('john.smith');
            expect(pullRequests[1].reviewers[0].user.username).to.eq('john.smith');
        });

        it('should not return duplicated pull requests when requesting for user pull requests', () => {
            var authorOne = new models.User();
            authorOne.username = 'john.smith';

            var authorTwo = new models.User();
            authorTwo.username = 'anna.kowalsky';

            var authorAsReviewer = new models.Reviewer();
            authorAsReviewer.user = authorOne;
            authorAsReviewer.approved = true;

            var project = new models.Project();
            project.fullName = 'team_name/repo_name';

            var anotherProject = new models.Project();
            project.fullName = 'team_name/another_repo_name';

            var prOne = new models.PullRequest();
            prOne.id = 1;
            prOne.targetRepository = project;
            prOne.author = authorOne;
            prOne.reviewers.push(authorAsReviewer);

            var prTwo = new models.PullRequest();
            prTwo.id = 1;
            prTwo.targetRepository = anotherProject;
            prTwo.author = authorTwo;
            prTwo.reviewers.push(authorAsReviewer);

            repositories.PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];

            var pullRequests = repositories.PullRequestRepository.findByUser('john.smith');
            expect(pullRequests).to.have.length(2);
        });

        it('should allow to add new pull request', () => {
            var project = new models.Project();
            project.fullName = 'aaa/bbb';

            var pullRequest = new models.PullRequest();
            pullRequest.title = 'This is some title';
            pullRequest.targetRepository = project;

            repositories.PullRequestRepository.add(pullRequest);

            var actualPullRequests: Array<models.PullRequest> = repositories.PullRequestRepository.findAll();
            expect(actualPullRequests).to.have.length(1);

            expect(actualPullRequests[0]).to.eq(pullRequest);
            expect(repositories.PullRequestRepository.pullRequests['aaa/bbb'][0]).to.eq(pullRequest);
        });

        it('should allow to update a pull request', () => {
            var sampleProject = new models.Project();
            sampleProject.fullName = 'team_name/repo_name';

            var existentPullRequest = new models.PullRequest();
            existentPullRequest.id = 1;
            existentPullRequest.title = 'This is some title';
            existentPullRequest.description = 'This is a description';
            existentPullRequest.targetRepository = sampleProject;

            var newPullRequest = new models.PullRequest();
            newPullRequest.id = 1;
            newPullRequest.title = 'This is new title';
            newPullRequest.targetRepository = sampleProject;
            newPullRequest.state = models.PullRequestState.Open;

            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [existentPullRequest];
            repositories.PullRequestRepository.update(newPullRequest);

            var pullRequests = repositories.PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(1);
            expect(pullRequests[0].id).to.eq(1);
            expect(pullRequests[0].title).to.eq('This is new title');
            expect(pullRequests[0].description).to.be.undefined;
        });

        it('should add a new pull request on update if it doesn\'t exist', () => {
            var sampleProject = new models.Project();
            sampleProject.fullName = 'team_name/repo_name';

            var newPullRequest = new models.PullRequest();
            newPullRequest.id = 1;
            newPullRequest.title = 'This is new title';
            newPullRequest.targetRepository = sampleProject;
            newPullRequest.state = models.PullRequestState.Open;

            repositories.PullRequestRepository.update(newPullRequest);

            var pullRequests = repositories.PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(1);
            expect(pullRequests[0].id).to.eq(1);
            expect(pullRequests[0].title).to.eq('This is new title');
        });

        it('should update a PullRequest only when its status is OPEN', () => {
            var incomingPr = new models.PullRequest();
            incomingPr.id = 1;
            incomingPr.title = 'This is new title';
            incomingPr.targetRepository.fullName = 'team_name/repo_name';
            incomingPr.state = models.PullRequestState.Merged;

            repositories.PullRequestRepository.pullRequests = {};
            repositories.PullRequestRepository.update(incomingPr);

            var pullRequests = repositories.PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(0);
        });

        it('should remove a pull request if its status is not OPEN', () => {
            var existentPullRequest = new models.PullRequest();
            existentPullRequest.id = 1;
            existentPullRequest.title = 'This is some title';
            existentPullRequest.description = 'This is a description';
            existentPullRequest.targetRepository.fullName = 'team_name/repo_name';
            existentPullRequest.state = models.PullRequestState.Open;

            var newPullRequest = new models.PullRequest();
            newPullRequest.id = 1;
            newPullRequest.title = 'This is new title';
            newPullRequest.targetRepository.fullName = 'team_name/repo_name';
            newPullRequest.state = models.PullRequestState.Merged;

            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [existentPullRequest];
            repositories.PullRequestRepository.update(newPullRequest);

            var pullRequests = repositories.PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(0);
        });

        it('should be able to remove given pull request', () => {
            var sampleProject = new models.Project();
            sampleProject.fullName = 'team_name/repo_name';

            var pullRequest = new models.PullRequest();
            pullRequest.id = 1;
            pullRequest.title = 'This is new title';
            pullRequest.targetRepository = sampleProject;

            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [pullRequest];

            repositories.PullRequestRepository.remove(pullRequest);

            expect(repositories.PullRequestRepository.findAll().length).to.eq(0);
        });
    });
});
