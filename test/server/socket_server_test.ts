///<reference path="../../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;
import socketIoClient = require('socket.io-client');
import socketServer = require('./../../lib/server/socket_server');
import repositories = require('./../../lib/repositories');
import models = require('./../../lib/models');
import eventDispatcher = require('./../../lib/events/event_dispatcher');

describe('SocketServer', () => {
    var options = {
        'force new connection': true
    };

    before(() => {
        socketServer.SocketServer.startSocketServer();
    });

    after(() => {
        socketServer.SocketServer.stopSocketServer();
    });

    it('should emit server:introduced on client:introduce event', (done) => {
        var client = socketIoClient.connect('http://localhost:8765', options);
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

        var authoredPullRequest = new models.PullRequest();
        authoredPullRequest.title = 'Authored pull request';
        authoredPullRequest.author = user;

        var userAsReviewer = new models.Reviewer();
        userAsReviewer.user = user;

        var assignedPullRequest = new models.PullRequest();
        assignedPullRequest.title = 'Assigned pull request';
        assignedPullRequest.reviewers.push(userAsReviewer);

        repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [
            authoredPullRequest,
            assignedPullRequest
        ];

        var client = socketIoClient.connect('http://localhost:8765', options);
        client.on('server:introduced', (pullRequests: models.UserPullRequestsSet) => {
            expect(pullRequests.assigned.length).to.eq(1);
            expect(pullRequests.authored.length).to.eq(1);

            expect(pullRequests.assigned[0].title).to.eq('Assigned pull request');
            expect(pullRequests.authored[0].title).to.eq('Authored pull request');

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

        it('should emit server:pullrequests:updated on webhook:pullrequest:created', (done) => {
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
            authoredPullRequest.title = 'Authored pull request';
            authoredPullRequest.author = user;

            var userAsReviewer = new models.Reviewer();
            userAsReviewer.user = user;

            var assignedPullRequest = new models.PullRequest();
            assignedPullRequest.title = 'Assigned pull request';
            assignedPullRequest.reviewers.push(userAsReviewer);

            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [
                authoredPullRequest,
                assignedPullRequest
            ];

            var client = socketIoClient.connect('http://localhost:8765', options);
            client.emit('client:introduce', username);

            client.on('server:introduced', () => {
                client.on('server:pullrequests:updated', (pullRequests: models.UserPullRequestsSet) => {
                    expect(pullRequests.assigned.length).to.eq(0);
                    expect(pullRequests.authored.length).to.eq(1);

                    expect(pullRequests.authored[0].title).to.eq('Authored pull request');

                    client.disconnect();
                    done();
                });

                dispatcher.emit('webhook:pullrequest:created', payload);
            });
        });
    });
});
