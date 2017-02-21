import {expect} from 'chai';
import * as socketIoClient from 'socket.io-client';
import * as socketServer from './../../lib/server/socket_server';
import {PullRequestRepository} from '../../lib/repository';
import {PullRequest, PullRequestEvent, PullRequestWithActor} from '../../lib/model';
import {EventDispatcher} from '../../lib/events/event_dispatcher';
import {Config} from '../../lib/config';
import {PullRequestFaker, ReviewerFaker, ProjectFaker, UserFaker} from '../faker/model_faker';

describe('SocketServer', () => {
    const prFaker = new PullRequestFaker();
    const reviewerFaker = new ReviewerFaker();
    const projectFaker = new ProjectFaker();
    const userFaker = new UserFaker();

    const socketOptions = {
        'force new connection': true
    };
    const socketPort = 4321;

    before(() => {
        const config = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: socketPort
        };
        Config.reset();
        Config.setUp({config: config});

        socketServer.SocketServer.startSocketServer();
    });

    after(() => {
        socketServer.SocketServer.stopSocketServer();
    });

    it('should emit server:introduced on client:introduce event', (done) => {
        const client = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);
        client.on('server:introduced', () => {
            client.disconnect();
            done();
        });

        client.emit('client:introduce');
    });

    it("should emit intro message with user's pull requests and assigned pull requests", (done) => {
        const projectName = 'team_name/repo_name';
        const project = projectFaker.fake({fullName: projectName});

        const username = 'john.smith';
        const reviewer = reviewerFaker.fake({user: {username: username}});

        const authoredPullRequest = prFaker.fake({targetRepository: project, author: {username: username}});
        const assignedPullRequest = prFaker.fake({targetRepository: project, reviewers: [reviewer]});

        PullRequestRepository.pullRequests['team_name/repo_name'] = [
            authoredPullRequest,
            assignedPullRequest
        ];

        const client = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);
        client.on('server:introduced', (pullRequests: PullRequestEvent) => {
            expect(pullRequests.sourceEvent).to.eq('client:introduce');
            expect(pullRequests.pullRequests.length).to.eq(2);

            expect(pullRequests.pullRequests[0].id).to.eq(authoredPullRequest.id);
            expect(pullRequests.pullRequests[1].id).to.eq(assignedPullRequest.id);

            client.disconnect();
            done();
        });

        client.emit('client:introduce', username);
    });

    it('should notify reviewers who haven\'t approved the pull request yet on client:remind', (done) => {
        const approvedReviewer = reviewerFaker.fake({approved: true});
        const unapprovedReviewer = reviewerFaker.fake({approved: false});

        const pullRequest = prFaker.fake({reviewers: [approvedReviewer, unapprovedReviewer]});

        PullRequestRepository.pullRequests['team_name/repo_name'] = [
            pullRequest
        ];

        const client = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);
        client.on('server:introduced', () => {
            client.on('server:remind', (pullRequestToRemind: PullRequest) => {
                expect(pullRequestToRemind.id).to.eq(pullRequest.id);
                client.disconnect();
                done();
            });

            client.emit('client:remind', pullRequest);
        });

        client.emit('client:introduce', unapprovedReviewer.user.username);
    });

    describe('Emitting pull requests via sockets to author', () => {
        const dispatcher = EventDispatcher.getInstance();

        function testEmittingEventViaSocket(inputEvent: string, done): void {
            const username = 'john.smith';

            const projectName = 'team_name/repo_name';
            const project = projectFaker.fake({fullName: projectName});

            const reviewer = reviewerFaker.fake({user: {username: username}});

            const authoredPullRequest = prFaker.fake({author: {username: username}, targetRepository: project});
            const assignedPullRequest = prFaker.fake({reviewers: [reviewer], targetRepository: project});

            const payload = new PullRequestWithActor();
            payload.pullRequest = authoredPullRequest;
            payload.actor = userFaker.fake();

            PullRequestRepository.pullRequests['team_name/repo_name'] = [
                authoredPullRequest,
                assignedPullRequest
            ];

            const client = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);
            client.emit('client:introduce', username);

            const reviewerClient = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);
            reviewerClient.emit('client:introduce');

            client.on('server:introduced', () => {
                client.on('server:pullrequests:updated', (pullRequestEvent: PullRequestEvent) => {
                    expect(pullRequestEvent.sourceEvent).to.eq(inputEvent);
                    expect(pullRequestEvent.context.id).to.eq(authoredPullRequest.id);
                    expect(pullRequestEvent.context.title).to.eq(authoredPullRequest.title);
                    expect(pullRequestEvent.actor.username).to.eq(payload.actor.username);
                    expect(pullRequestEvent.pullRequests.length).to.eq(2);

                    client.disconnect();
                    done();
                });

                dispatcher.emit(inputEvent, payload);
            });
        }

        it('should emit server:pullrequests:updated on webhook:pullrequest:created', (done) => {
            const inputEvent = 'webhook:pullrequest:created';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:updated', (done) => {
            const inputEvent = 'webhook:pullrequest:updated';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:approved', (done) => {
            const inputEvent = 'webhook:pullrequest:approved';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:unapproved', (done) => {
            const inputEvent = 'webhook:pullrequest:unapproved';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:fulfilled', (done) => {
            const inputEvent = 'webhook:pullrequest:fulfilled';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:rejected', (done) => {
            const inputEvent = 'webhook:pullrequest:rejected';
            testEmittingEventViaSocket(inputEvent, done);
        });
    });

    describe('Emitting pull requests via sockets to reviewers', () => {
        const dispatcher = EventDispatcher.getInstance();

        function testEmittingEventViaSocket(inputEvent: string, expectedEvent: string, done): void {
            const reviewerUsername = 'anna.kowalsky';

            const projectName = 'team_name/repo_name';
            const project = projectFaker.fake({fullName: projectName});

            const reviewer = reviewerFaker.fake({user: {username: reviewerUsername}});

            const authoredPullRequest = prFaker.fake({author: {username: reviewerUsername}, targetRepository: project});
            const assignedPullRequest = prFaker.fake({reviewers: [reviewer], targetRepository: project});

            const payload = new PullRequestWithActor();
            payload.pullRequest = assignedPullRequest;
            payload.actor = userFaker.fake();

            PullRequestRepository.pullRequests['team_name/repo_name'] = [
                authoredPullRequest,
                assignedPullRequest
            ];

            const client = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);

            try {
                client.emit('client:introduce', reviewerUsername);

                client.on('server:introduced', () => {
                    client.on(expectedEvent, (pullRequests: PullRequestEvent) => {
                        expect(pullRequests.sourceEvent).to.eq(inputEvent);
                        expect(pullRequests.context.id).to.eq(assignedPullRequest.id);
                        expect(pullRequests.actor.username).to.eq(payload.actor.username);

                        expect(pullRequests.pullRequests.length).to.eq(2);

                        client.disconnect();
                        done();
                    });

                    dispatcher.emit(inputEvent, payload);
                });
            } catch (e) {
                done(e);
            }
        }

        it('should emit server:pullrequests:updated on webhook:pullrequest:created', (done) => {
            const inputEvent = 'webhook:pullrequest:created';
            const expectedEvent = 'server:pullrequests:updated';
            testEmittingEventViaSocket(inputEvent, expectedEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:updated', (done) => {
            const inputEvent = 'webhook:pullrequest:updated';
            const expectedEvent = 'server:pullrequests:updated';
            testEmittingEventViaSocket(inputEvent, expectedEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:approved', (done) => {
            const inputEvent = 'webhook:pullrequest:approved';
            const expectedEvent = 'server:pullrequests:updated';
            testEmittingEventViaSocket(inputEvent, expectedEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:unapproved', (done) => {
            const inputEvent = 'webhook:pullrequest:unapproved';
            const expectedEvent = 'server:pullrequests:updated';
            testEmittingEventViaSocket(inputEvent, expectedEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:fulfilled', (done) => {
            const inputEvent = 'webhook:pullrequest:fulfilled';
            const expectedEvent = 'server:pullrequests:updated';
            testEmittingEventViaSocket(inputEvent, expectedEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:rejected', (done) => {
            const inputEvent = 'webhook:pullrequest:rejected';
            const expectedEvent = 'server:pullrequests:updated';
            testEmittingEventViaSocket(inputEvent, expectedEvent, done);
        });

        it('should emit server:pullrequest:updated on webhook:pullrequest:updated', (done) => {
            const inputEvent = 'webhook:pullrequest:updated';
            const expectedEvent = 'server:pullrequest:updated';

            const reviewer = reviewerFaker.fake({approved: true});
            const pullRequest = prFaker.fake({reviewers: [reviewer]});
            const payload = new PullRequestWithActor();
            payload.pullRequest = pullRequest;
            payload.actor = userFaker.fake();

            const client = socketIoClient.connect('http://localhost:' + socketPort, socketOptions);
            client.on('server:introduced', () => {
                client.on(expectedEvent, (updatedPullRequest: PullRequest) => {
                    expect(updatedPullRequest.id).to.eq(pullRequest.id);
                    client.disconnect();
                    done();
                });

                dispatcher.emit(inputEvent, payload);
            });

            client.emit('client:introduce', reviewer.user.username);
        });
    });
});
