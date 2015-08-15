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
                userPullRequests.sourceEvent = 'client:introduce';
                userPullRequests.pullRequests = repositories.PullRequestRepository.findByUser(username);

                logger.info("Emitting event 'server:introduced'");
                this.io.to(username).emit('server:introduced', userPullRequests);
            });
        });

        dispatcher.on('webhook:pullrequest:created', (payloadDecoded: any) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:created', payloadDecoded);
        });
        dispatcher.on('webhook:pullrequest:updated', (payloadDecoded: any) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:updated', payloadDecoded);
        });
        dispatcher.on('webhook:pullrequest:approved', (payloadDecoded: any) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:approved', payloadDecoded);
        });
        dispatcher.on('webhook:pullrequest:unapproved', (payloadDecoded: any) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:unapproved', payloadDecoded);
        });
        dispatcher.on('webhook:pullrequest:fulfilled', (payloadDecoded: any) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:fulfilled', payloadDecoded);
        });
        dispatcher.on('webhook:pullrequest:rejected', (payloadDecoded: any) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:rejected', payloadDecoded);
        });
    }

    static stopSocketServer(): void {
        this.io.close();
    }

    // @todo Send request to reviewers
    private static onWebhookEvent(eventName:string, payloadDecoded: {pullrequest: any}): void {
        logger.info('Webhook event received');
        var pullRequest = factories.PullRequestFactory.create(payloadDecoded.pullrequest);
        var author = pullRequest.author.username;

        var userPullRequests = new models.PullRequestEvent();
        userPullRequests.sourceEvent = eventName;
        userPullRequests.context = pullRequest;
        userPullRequests.pullRequests = repositories.PullRequestRepository.findByUser(author);

        logger.info("Emitting event 'server:pullrequests:updated'");
        SocketServer.io.to(author).emit('server:pullrequests:updated', userPullRequests);
    }
}
