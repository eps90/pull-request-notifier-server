///<reference path="../../typings/tsd.d.ts"/>

import Server = require('socket.io');
import repositories = require('./../repositories');
import models = require('./../models');
import factories = require('./../factories');
import eventDispatcher = require('./../events/event_dispatcher');
import logger = require('./../logger');
import configModule = require('./../config');
import _ = require('lodash');

export class SocketServer {
    static io: SocketIO.Server;
    static startSocketServer(): void {
        var config = configModule.Config.getConfig();
        var socketPort = config.socket_port;

        logger.info('Starting socket.io server', {port: socketPort.toString()});
        this.io = Server(socketPort);
        var dispatcher = eventDispatcher.EventDispatcher.getInstance();

        this.io.on('connection', (socket) => {
            logger.info('Client connected');

            socket.on(models.SocketClientEvent.INTRODUCE, (username: string) => {
                logger.info('Client introduced', {username: username});
                socket.join(username);

                var userPullRequests = new models.PullRequestEvent();
                userPullRequests.sourceEvent = models.SocketClientEvent.INTRODUCE;
                userPullRequests.pullRequests = repositories.PullRequestRepository.findByUser(username);

                logger.info("Emitting event", {event: 'server:introduced', username: username});
                this.io.to(username).emit(models.SocketServerEvent.INTRODUCED, userPullRequests);
            });

            socket.on(models.SocketClientEvent.REMIND, (pullRequest: models.PullRequest) => {
                logger.info('Reminder for pull request received');
                var reviewersToRemind: string[] = _.map(
                    _.filter(pullRequest.reviewers, (reviewer: models.Reviewer) => {
                        return !reviewer.approved;
                    }),
                    (reviewer: models.Reviewer) => {
                        return reviewer.user.username;
                    }
                );

                for (var reviewerIdx = 0, reviewersLen = reviewersToRemind.length; reviewerIdx < reviewersLen; reviewerIdx++) {
                    var reviewerUsername = reviewersToRemind[reviewerIdx];
                    logger.info('Sending a reminder', { username: reviewerUsername });
                    this.io.to(reviewerUsername).emit(models.SocketServerEvent.REMIND, pullRequest);
                }
            });
        });

        dispatcher.on(models.WebhookEvent.PULLREQUEST_CREATED, (body: {pullRequest: models.PullRequest, actor: models.User}) => {
            SocketServer.onWebhookEvent(models.WebhookEvent.PULLREQUEST_CREATED, body.pullRequest, body.actor);
        });
        dispatcher.on(models.WebhookEvent.PULLREQUEST_UPDATED, (body: {pullRequest: models.PullRequest, actor: models.User}) => {
            SocketServer.onWebhookEvent(models.WebhookEvent.PULLREQUEST_UPDATED, body.pullRequest, body.actor);
        });
        dispatcher.on(models.WebhookEvent.PULLREQUEST_APPROVED, (body: {pullRequest: models.PullRequest, actor: models.User}) => {
            SocketServer.onWebhookEvent(models.WebhookEvent.PULLREQUEST_APPROVED, body.pullRequest, body.actor);
        });
        dispatcher.on(models.WebhookEvent.PULLREQUEST_UNAPPROVED, (body: {pullRequest: models.PullRequest, actor: models.User}) => {
            SocketServer.onWebhookEvent(models.WebhookEvent.PULLREQUEST_UNAPPROVED, body.pullRequest, body.actor);
        });
        dispatcher.on(models.WebhookEvent.PULLREQUEST_FULFILLED, (body: {pullRequest: models.PullRequest, actor: models.User}) => {
            SocketServer.onWebhookEvent(models.WebhookEvent.PULLREQUEST_FULFILLED, body.pullRequest, body.actor);
        });
        dispatcher.on(models.WebhookEvent.PULLREQUEST_REJECTED, (body: {pullRequest: models.PullRequest, actor: models.User}) => {
            SocketServer.onWebhookEvent(models.WebhookEvent.PULLREQUEST_REJECTED, body.pullRequest, body.actor);
        });
    }

    static stopSocketServer(): void {
        this.io.close();
    }

    private static onWebhookEvent(eventName: string, pullRequest: models.PullRequest, actor: models.User): void {
        logger.info('Webhook event received', {event: eventName});
        var author = pullRequest.author.username;

        var userPullRequests = new models.PullRequestEvent();
        userPullRequests.actor = actor;
        userPullRequests.sourceEvent = eventName;
        userPullRequests.context = pullRequest;
        // @todo Bring back authored and assigned pull requests
        userPullRequests.pullRequests = repositories.PullRequestRepository.findByUser(author);

        logger.info("Emitting event", { event: 'server:pullrequests:updated', username: author });
        SocketServer.io.to(author).emit(models.SocketServerEvent.PULLREQUESTS_UPDATED, userPullRequests);

        var reviewers: Array<models.Reviewer> = pullRequest.reviewers || [];

        for (var reviewerIdx = 0, reviewersLength = reviewers.length; reviewerIdx < reviewersLength; reviewerIdx++) {
            var reviewerUsername = reviewers[reviewerIdx].user.username;
            var reviewerPr = new models.PullRequestEvent();
            reviewerPr.sourceEvent = eventName;
            reviewerPr.actor = actor;
            reviewerPr.context = pullRequest;
            // @todo Bring back authored and assigned pull requests
            reviewerPr.pullRequests = repositories.PullRequestRepository.findByUser(reviewerUsername);

            logger.info("Emitting event", {event: 'server:pullrequests:updated', username: reviewerUsername });
            SocketServer.io.to(reviewerUsername).emit(models.SocketServerEvent.PULLREQUESTS_UPDATED, reviewerPr);
        }
    }
}
