import {Project, PullRequest, User, PullRequestState} from './../lib/model';
import {PullRequestRepository, ProjectRepository} from './../lib/repository';
import * as nock from 'nock';
import * as chai from 'chai';
import {Config} from '../lib/config';
import {ProjectFaker, PullRequestFaker, ReviewerFaker} from './faker/model_faker';

import chaiAsPromised  = require('chai-as-promised');
chai.use(chaiAsPromised);

var expect = chai.expect;

var prFaker = new PullRequestFaker();
var reviewerFaker = new ReviewerFaker();
var projectFaker = new ProjectFaker();

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

        Config.setUp({config: appConfig});
    });

    after(() => {
        Config.reset();
    });

    var basicAuth = {
        user: 'my.user',
        pass: 'topsecret'
    };

    describe("ProjectRepository", () => {
        beforeEach(() => {
            ProjectRepository.repositories = [];
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

            ProjectRepository.fetchAll()
                .then((repos: Array<Project>) => {
                    expect(repos).to.have.length(3);
                    var repository: Project = repos[0];
                    expect(repository).to.be.instanceOf(Project);
                    expect(repository.name).to.eq('my_repo');
                    expect(repository.fullName).to.eq('org/my_repo');

                    var anotherRepository: Project = repos[1];
                    expect(anotherRepository).to.be.instanceOf(Project);
                    expect(anotherRepository.name).to.eq('another_repo');
                    expect(anotherRepository.fullName).to.eq('org/another_repo');

                    var thirdRepository: Project = repos[2];
                    expect(thirdRepository).to.be.instanceOf(Project);
                    expect(thirdRepository.name).to.eq('aaaa');
                    expect(thirdRepository.fullName).to.eq('bbbb');

                    expect(ProjectRepository.repositories).to.eq(repos);

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

            expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
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

            expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should throw an error when request has returned non-successful response code', (done) => {
            nock('http://example.com')
                .get('/repositories/bitbucket')
                .basicAuth(basicAuth)
                .reply(403, 'Forbidden');

            expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
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

            expect(ProjectRepository.fetchAll()).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should find all known repositories', () => {
            var projects = [new Project(), new Project()];
            ProjectRepository.repositories = projects;
            var foundRepos = ProjectRepository.findAll();
            expect(foundRepos).to.equal(projects);
        });
    });

    describe("PullRequestRepository", () => {
        beforeEach(() => {
            PullRequestRepository.pullRequests = {};
        });

        afterEach(() => {
            nock.cleanAll();
        });

        it('should fetch open pull requests by requesting for them', (done) => {
            var project = new Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            var pullRequests: any = {
                size: 19,
                pagelen: 10,
                next: 'http://example.com/bitbucket/bitbucket/pullrequests?page=2&state=OPEN',
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

            PullRequestRepository.fetchByProject(project).then((prs: Array<PullRequest>) => {
                expect(prs).to.have.length(2);
                var pullRequest = prs[0];
                expect(pullRequest).to.be.instanceOf(PullRequest);
                expect(pullRequest.author).to.be.instanceOf(User);
                expect(pullRequest.state).to.eq(PullRequestState.Open);
                expect(pullRequest.reviewers).to.be.lengthOf(1);

                expect(PullRequestRepository.pullRequests['bitbucket/bitbucket']).to.eq(prs);

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

            var project = new Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            expect(PullRequestRepository.fetchByProject(project)).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should throw an error when authorization data is incorrect', (done) => {
            nock('http://example.com')
                .get('/bitbucket/bitbucket/pullrequests')
                .basicAuth(basicAuth)
                .reply(403, 'Forbidden');

            var project = new Project();
            project.fullName = 'bitbucket/bitbucket';
            project.pullRequestsUrl = 'http://example.com/bitbucket/bitbucket/pullrequests';

            expect(PullRequestRepository.fetchByProject(project)).to.be.rejectedWith(Error).and.notify(done);
        });

        it('should fetch single pull request by its project and id', (done) => {
            var pullRequestId = 1;
            var project = new Project();
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

            PullRequestRepository.fetchOne(project, pullRequestId).then((pr: PullRequest) => {
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

            PullRequestRepository.fetchOne('http://example.com/repositories/bitbucket/bitbucket/pullrequests/1')
                .then((pr: PullRequest) => {
                    expect(pr.id).to.eq(1);
                    expect(pr.title).to.eq('Fixed bugs');
                    done();
                }).catch((e) => {
                    done(e);
                });
        });

        it('should find all known pull requests', () => {
            PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                new PullRequest(),
                new PullRequest()
            ];

            var pullRequests = PullRequestRepository.findAll();
            expect(pullRequests).to.have.length(2);
        });

        it('should find all known pull requests even if they are from different repositories', () => {
            PullRequestRepository.pullRequests['aaa/bbb'] = [
                new PullRequest(),
                new PullRequest()
            ];

            PullRequestRepository.pullRequests['ccc/ddd'] = [
                new PullRequest(),
                new PullRequest()
            ];

            var prs = PullRequestRepository.findAll();
            expect(prs).to.have.length(4);
        });

        it('should find pull requests assigned to user by its username', () => {
            var reviewerUserName = 'john.smith';
            var reviewer = reviewerFaker.fake({user: {username: reviewerUserName}});

            var prOne = prFaker.fake({reviewers: [reviewer]});
            var prTwo = prFaker.fake();

            PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];

            var pullRequests = PullRequestRepository.findByReviewer(reviewerUserName);

            expect(pullRequests).to.have.length(1);
            expect(pullRequests[0].reviewers[0].user.username).to.eq(reviewerUserName);
        });

        it('should find pull requests by their author', () => {
            var authorUsername = 'john.smith';
            var prOne = prFaker.fake({author: {username: authorUsername}});
            var prTwo = prFaker.fake();

            PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];

            var pullRequests = PullRequestRepository.findByAuthor(authorUsername);
            expect(pullRequests).to.have.length(1);
            expect(pullRequests[0].author.username).to.eq(authorUsername);
        });

        it('should find all pull requests belonging to user (assigned and authored)', () => {
            var userName = 'john.smith';
            var prOne = prFaker.fake({author: {username: userName}});

            var reviewer = reviewerFaker.fake({user: {username: userName}});
            var prTwo = prFaker.fake({reviewers: [reviewer]});

            PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];

            var pullRequests = PullRequestRepository.findByUser(userName);
            expect(pullRequests).to.have.length(2);
            expect(pullRequests[0].author.username).to.eq(userName);
            expect(pullRequests[1].reviewers[0].user.username).to.eq(userName);
        });

        it('should not return duplicated pull requests when requesting for user pull requests', () => {
            var userName = 'john.smith';
            var reviewer = reviewerFaker.fake({user: {username: userName }});
            var prOne = prFaker.fake({author: {username: userName}, reviewers: [reviewer]});
            var prTwo = prFaker.fake({author: {username: userName}, reviewers: [reviewer]});

            PullRequestRepository.pullRequests['bitbucket/bitbucket'] = [
                prOne,
                prTwo
            ];

            var pullRequests = PullRequestRepository.findByUser(userName);
            expect(pullRequests).to.have.length(2);
        });

        it('should allow to add new pull request', () => {
            var pullRequest = prFaker.fake();

            PullRequestRepository.add(pullRequest);

            var actualPullRequests: PullRequest[] = PullRequestRepository.findAll();

            expect(actualPullRequests).to.have.length(1);
            expect(actualPullRequests[0]).to.eq(pullRequest);
        });

        it('should allow to update a pull request', () => {
            var projectName = 'team_name/repo_name';
            var project = projectFaker.fake({fullName: projectName});

            var prId = 1;

            var existentPullRequest = prFaker.fake({id: prId, targetRepository: project});
            var newPullRequest = prFaker.fake({id: prId, targetRepository: project, state: PullRequestState.Open});

            PullRequestRepository.pullRequests[projectName] = [existentPullRequest];
            PullRequestRepository.update(newPullRequest);

            var pullRequests = PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(1);
            expect(pullRequests[0].id).to.eq(prId);
        });

        it('should add a new pull request on update if it doesn\'t exist', () => {
            var projectName = 'team_name/repo_name';
            var project = projectFaker.fake({fullName: projectName});

            var prId = 1;
            var newPullRequest = prFaker.fake({id: prId, targetRepository: project, state: PullRequestState.Open});

            expect(PullRequestRepository.findAll().length).to.eq(0);

            PullRequestRepository.update(newPullRequest);

            var pullRequests = PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(1);
            expect(pullRequests[0].id).to.eq(prId);
        });

        it('should update a PullRequest only when its status is OPEN', () => {
            var incomingPr = prFaker.fake({state: PullRequestState.Merged});

            PullRequestRepository.pullRequests = {};
            PullRequestRepository.update(incomingPr);

            var pullRequests = PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(0);
        });

        it('should remove a pull request if its status is not OPEN', () => {
            var projectName = 'team_name/repo_name';
            var project = projectFaker.fake({fullName: projectName});

            var prId = 1;

            var existentPullRequest = prFaker.fake({id: prId, targetRepository: project, state: PullRequestState.Open});
            var incomingPr = prFaker.fake({id: prId, targetRepository: project, state: PullRequestState.Merged});

            PullRequestRepository.pullRequests[projectName] = [existentPullRequest];
            PullRequestRepository.update(incomingPr);

            var pullRequests = PullRequestRepository.findAll();
            expect(pullRequests.length).to.eq(0);
        });

        it('should be able to remove given pull request', () => {
            var projectName = 'team_name/repo_name';
            var project = projectFaker.fake({fullName: projectName});

            var prId = 1;

            var pullRequest = prFaker.fake({id: prId, targetRepository: project, state: PullRequestState.Open});

            PullRequestRepository.pullRequests['team_name/repo_name'] = [pullRequest];

            PullRequestRepository.remove(pullRequest);

            expect(PullRequestRepository.findAll().length).to.eq(0);
        });
    });
});
