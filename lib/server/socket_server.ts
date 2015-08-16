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

        dispatcher.on('webhook:pullrequest:created', (pullRequest: models.PullRequest) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:created', pullRequest);
        });
        dispatcher.on('webhook:pullrequest:updated', (pullRequest: models.PullRequest) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:updated', pullRequest);
        });
        dispatcher.on('webhook:pullrequest:approved', (pullRequest: models.PullRequest) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:approved', pullRequest);
        });
        dispatcher.on('webhook:pullrequest:unapproved', (pullRequest: models.PullRequest) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:unapproved', pullRequest);
        });
        dispatcher.on('webhook:pullrequest:fulfilled', (pullRequest: models.PullRequest) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:fulfilled', pullRequest);
        });
        dispatcher.on('webhook:pullrequest:rejected', (pullRequest: models.PullRequest) => {
            SocketServer.onWebhookEvent('webhook:pullrequest:rejected', pullRequest);
        });
    }

    static stopSocketServer(): void {
        this.io.close();
    }

    private static onWebhookEvent(eventName: string, pullRequest: models.PullRequest): void {
        logger.info('Webhook event received');
        var author = pullRequest.author.username;

        var userPullRequests = new models.PullRequestEvent();
        userPullRequests.sourceEvent = eventName;
        userPullRequests.context = pullRequest;
        userPullRequests.pullRequests = repositories.PullRequestRepository.findByUser(author);

        logger.info("Emitting event 'server:pullrequests:updated' to '" + author + "'");
        SocketServer.io.to(author).emit('server:pullrequests:updated', userPullRequests);

        var reviewers: Array<models.Reviewer> = pullRequest.reviewers || [];

        for (var reviewerIdx = 0, reviewersLength = reviewers.length; reviewerIdx < reviewersLength; reviewerIdx++) {
            var reviewerUsername = reviewers[reviewerIdx].user.username;
            var reviewerPr = new models.PullRequestEvent();
            reviewerPr.sourceEvent = eventName;
            reviewerPr.context = pullRequest;
            reviewerPr.pullRequests = repositories.PullRequestRepository.findByUser(reviewerUsername);

            logger.info("Emitting event 'server:pullrequests:updated' to '" + reviewerUsername + '"');
            SocketServer.io.to(reviewerUsername).emit('server:pullrequests:updated', reviewerPr);
        }
    }
}
