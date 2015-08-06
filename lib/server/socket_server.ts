///<reference path="../../typings/tsd.d.ts"/>

import Server = require('socket.io');
import repositories = require('./../repositories');
import models = require('./../models');
import factories = require('./../factories');
import eventDispatcher = require('./../events/event_dispatcher');

export class SocketServer {
    static io: SocketIO.Server;
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

        dispatcher.on('webhook:pullrequest:created', SocketServer.onWebhookEvent);
        dispatcher.on('webhook:pullrequest:updated', SocketServer.onWebhookEvent);
        dispatcher.on('webhook:pullrequest:approved', SocketServer.onWebhookEvent);
        dispatcher.on('webhook:pullrequest:unapproved', SocketServer.onWebhookEvent);
        dispatcher.on('webhook:pullrequest:fulfilled', SocketServer.onWebhookEvent);
        dispatcher.on('webhook:pullrequest:rejected', SocketServer.onWebhookEvent);
    }

    private static onWebhookEvent(payloadDecoded: {pullrequest: any}) {
        var pullRequest = factories.PullRequestFactory.create(payloadDecoded.pullrequest);
        var author = pullRequest.author.username;

        var userPullRequests = new models.UserPullRequestsSet();
        userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(author);

        SocketServer.io.to(author).emit('server:pullrequests:updated', userPullRequests);
    }

    static stopSocketServer() {
        this.io.close();
    }
}
