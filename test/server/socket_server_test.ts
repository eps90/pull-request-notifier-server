///<reference path="../../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import socketIoClient = require('socket.io-client');
import socketServer = require('./../../lib/server/socket_server');
import repositories = require('./../../lib/repositories');
import models = require('./../../lib/models');
import eventDispatcher = require('./../../lib/events/event_dispatcher');
import configModule = require('./../../lib/config');

describe('SocketServer', () => {
    var options = {
        'force new connection': true
    };
    var socketPort = 4321;

    before(() => {
        var config = {
            baseUrl: 'http://example.com',
            teamName: 'aaaa',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: socketPort
        };
        configModule.Config.reset();
        configModule.Config.setUp({config: config});

        socketServer.SocketServer.startSocketServer();
    });

    after(() => {
        socketServer.SocketServer.stopSocketServer();
    });

    it('should emit server:introduced on client:introduce event', (done) => {
        var client = socketIoClient.connect('http://localhost:' + socketPort, options);
        client.on('server:introduced', () => {
            client.disconnect();
            done();
        });

        client.emit('client:introduce');
    });

    it("should emit intro message with user's pull requests and assigned pull requests", (done) => {
        var project = new models.Project();
        project.fullName = 'team_name/repo_name';

        var username = 'john.smith';
        var user = new models.User();
        user.username = username;

        var project = new models.Project();
        project.fullName = 'team_name/repo_name';

        var authoredPullRequest = new models.PullRequest();
        authoredPullRequest.id = 1;
        authoredPullRequest.title = 'Authored pull request';
        authoredPullRequest.author = user;
        authoredPullRequest.targetRepository = project;

        var userAsReviewer = new models.Reviewer();
        userAsReviewer.user = user;

        var assignedPullRequest = new models.PullRequest();
        assignedPullRequest.title = 'Assigned pull request';
        assignedPullRequest.reviewers.push(userAsReviewer);
        assignedPullRequest.targetRepository = project;

        repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [
            authoredPullRequest,
            assignedPullRequest
        ];

        var client = socketIoClient.connect('http://localhost:' + socketPort, options);
        client.on('server:introduced', (pullRequests: models.PullRequestEvent) => {
            expect(pullRequests.sourceEvent).to.eq('client:introduce');
            expect(pullRequests.context).to.be.undefined;
            expect(pullRequests.pullRequests.length).to.eq(2);

            expect(pullRequests.pullRequests[0].title).to.eq('Authored pull request');
            expect(pullRequests.pullRequests[1].title).to.eq('Assigned pull request');

            client.disconnect();
            done();
        });

        client.emit('client:introduce', username);
    });

    describe('Emitting pull requests via sockets', () => {
        var dispatcher = eventDispatcher.EventDispatcher.getInstance();

        after(() => {
            dispatcher.removeAllListeners();
        });

        function testEmittingEventViaSocket(inputEvent: string, done): void {
            var username = 'john.smith';
            var payload = {
                pullrequest: {
                    "id" :  1 ,
                    "title" :  "Title of pull request" ,
                    "description" :  "Description of pull request" ,
                    "state" :  "OPEN" ,
                    "author" : {
                        "username": username,
                        "display_name": "Emma"
                    },
                    "destination" : {
                        "branch" : {  "name" :  "master" },
                        "repository" : {
                            "full_name": "team_name/repo_name",
                            "name": "repo_name"
                        }
                    },
                    "participants" : [
                        // @todo
                    ],
                    "links": {
                        "self": {
                            "href": "https://api.bitbucket.org/api/2.0/pullrequests/1"
                        }
                    }
                }
            };

            var project = new models.Project();
            project.fullName = 'team_name/repo_name';

            var user = new models.User();
            user.username = username;

            var authoredPullRequest = new models.PullRequest();
            authoredPullRequest.id = 1;
            authoredPullRequest.title = 'Authored pull request';
            authoredPullRequest.author = user;
            authoredPullRequest.targetRepository = project;

            var userAsReviewer = new models.Reviewer();
            userAsReviewer.user = user;

            var assignedPullRequest = new models.PullRequest();
            assignedPullRequest.id = 2;
            assignedPullRequest.title = 'Assigned pull request';
            assignedPullRequest.reviewers.push(userAsReviewer);
            assignedPullRequest.targetRepository = project;

            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [
                authoredPullRequest,
                assignedPullRequest
            ];

            var client = socketIoClient.connect('http://localhost:' + socketPort, options);
            client.emit('client:introduce', username);

            client.on('server:introduced', () => {
                client.on('server:pullrequests:updated', (pullRequests: models.PullRequestEvent) => {
                    expect(pullRequests.sourceEvent).to.eq(inputEvent);
                    expect(pullRequests.context.id).to.eq(1);
                    expect(pullRequests.context.title).to.eq('Title of pull request');

                    expect(pullRequests.pullRequests.length).to.eq(2);

                    expect(pullRequests.pullRequests[0].title).to.eq('Authored pull request');

                    client.disconnect();
                    done();
                });

                dispatcher.emit(inputEvent, payload);
            });
        }

        it('should emit server:pullrequests:updated on webhook:pullrequest:created', (done) => {
            var inputEvent = 'webhook:pullrequest:created';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:updated', (done) => {
            var inputEvent = 'webhook:pullrequest:updated';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:approved', (done) => {
            var inputEvent = 'webhook:pullrequest:approved';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:unapproved', (done) => {
            var inputEvent = 'webhook:pullrequest:unapproved';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:fulfilled', (done) => {
            var inputEvent = 'webhook:pullrequest:fulfilled';
            testEmittingEventViaSocket(inputEvent, done);
        });

        it('should emit server:pullrequests:updated on webhook:pullrequest:rejected', (done) => {
            var inputEvent = 'webhook:pullrequest:rejected';
            testEmittingEventViaSocket(inputEvent, done);
        });
    });
});
