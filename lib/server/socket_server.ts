///<reference path="../../typings/tsd.d.ts"/>

import Server = require('socket.io');
import repositories = require('./../repositories');
import models = require('./../models');
import factories = require('./../factories');
import eventDispatcher = require('./../events/event_dispatcher');
import logger = require('./../logger');
import configModule = require('./../config');

export class SocketServer {
    static io: SocketIO.Server;
    static startSocketServer(): void {
        var config = configModule.Config.getConfig();
        var socketPort = config.socket_port;

        logger.info('Starting socket.io server on port ' + socketPort);
        this.io = Server(socketPort);
        var dispatcher = eventDispatcher.EventDispatcher.getInstance();

        this.io.on('connection', (socket) => {
            logger.info('Client connected');

            socket.on('client:introduce', (username: string) => {
                logger.info('Client introduced');
                socket.join(username);

                var userPullRequests = new models.PullRequestEvent();
                userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(username);
                userPullRequests.assigned = repositories.PullRequestRepository.findByReviewer(username);

                logger.info("Emitting event 'server:introduced'");
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

    static stopSocketServer(): void {
        this.io.close();
    }

    // @todo Why assigned pull requests are sent?
    // @todo Sent all aggregated pull requests connected with author
    private static onWebhookEvent(payloadDecoded: {pullrequest: any}): void {
        logger.info('Webhook event received');
        var pullRequest = factories.PullRequestFactory.create(payloadDecoded.pullrequest);
        var author = pullRequest.author.username;

        var userPullRequests = new models.PullRequestEvent();
        userPullRequests.authored = repositories.PullRequestRepository.findByAuthor(author);

        logger.info("Emitting event 'server:pullrequests:updated'");
        SocketServer.io.to(author).emit('server:pullrequests:updated', userPullRequests);
    }
}
