///<reference path="../../typings/tsd.d.ts"/>

import Server = require('socket.io');
import repositories = require('./../repositories');
import models = require('./../models');
import factories = require('./../factories');
import eventDispatcher = require('./../events/event_dispatcher');

export class SocketServer {
    private static io: SocketIO.Server;
    static startSocketServer() {
        this.io = Server(8765);
        var dispatcher = eventDispatcher.EventDispatcher.getInstance();

        this.io.on('connection', (socket) => {

            socket.on('client:introduce', (username: string) => {
                socket.join(username);

                var userPullRequests = new models.UserPullRequestsSet();
                userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(username);
                userPullRequests.assigned = repositories.PullRequestRepository.findByReviewer(username);

                this.io.to(username).emit('server:introduced', userPullRequests);
            });
        });

        dispatcher.on('webhook:pullrequest:created', (payloadDecoded: {pullrequest: any}) => {
            var pullRequest = factories.PullRequestFactory.create(payloadDecoded.pullrequest);
            var author = pullRequest.author.username;

            var userPullRequests = new models.UserPullRequestsSet();
            userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(author);

            this.io.to(author).emit('server:pullrequests:updated', userPullRequests);
        });
    }

    static stopSocketServer() {
        this.io.close();
    }
}
