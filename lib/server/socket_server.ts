import * as Server from 'socket.io';
import {PullRequestRepository} from '../repository';
import {
    SocketClientEvent, PullRequest, PullRequestEvent, SocketServerEvent, Reviewer, WebhookEvent, PullRequestWithActor
} from '../model';
import {EventDispatcher} from '../events/event_dispatcher';
import logger from './../logger';
import {Config} from '../config';
import * as _ from 'lodash';

export class SocketServer {
    static io: SocketIO.Server;
    static startSocketServer(): void {
        const config = Config.getConfig();
        const socketPort = config.socket_port;

        logger.logSocketServerStart(socketPort.toString());
        this.io = Server(socketPort);
        const dispatcher = EventDispatcher.getInstance();

        this.io.on('connection', (socket) => {
            logger.logClientConnected();

            socket.on(SocketClientEvent.INTRODUCE, (username: string) => {
                logger.logClientIntroduced(username);
                socket.join(username);

                const userPullRequests = new PullRequestEvent();
                userPullRequests.sourceEvent = SocketClientEvent.INTRODUCE;
                userPullRequests.pullRequests = PullRequestRepository.findByUser(username);

                logger.logEmittingEventToUser(SocketServerEvent.INTRODUCED, username);
                this.io.to(username).emit(SocketServerEvent.INTRODUCED, userPullRequests);
            });

            socket.on(SocketClientEvent.REMIND, (pullRequest: PullRequest) => {
                logger.logReminderReceived();
                const reviewersToRemind: string[] = _.map(
                    _.filter(pullRequest.reviewers, (reviewer: Reviewer) => {
                        return !reviewer.approved;
                    }),
                    (reviewer: Reviewer) => {
                        return reviewer.user.username;
                    }
                );

                let reviewerIdx = 0, reviewersLen = reviewersToRemind.length;
                for (; reviewerIdx < reviewersLen; reviewerIdx++) {
                    const reviewerUsername = reviewersToRemind[reviewerIdx];
                    logger.logSendingReminderToUser(reviewerUsername);
                    this.io.to(reviewerUsername).emit(SocketServerEvent.REMIND, pullRequest);
                }
            });
        });

        dispatcher.on(WebhookEvent.PULLREQUEST_CREATED, (body: PullRequestWithActor) => {
            SocketServer.onWebhookEvent(WebhookEvent.PULLREQUEST_CREATED, body);
        });
        dispatcher.on(WebhookEvent.PULLREQUEST_UPDATED, (body: PullRequestWithActor) => {
            SocketServer.onWebhookEvent(WebhookEvent.PULLREQUEST_UPDATED, body);
        });

        dispatcher.on(WebhookEvent.PULLREQUEST_UPDATED, SocketServer.onWebhookPullRequestUpdated);

        dispatcher.on(WebhookEvent.PULLREQUEST_APPROVED, (body: PullRequestWithActor) => {
            SocketServer.onWebhookEvent(WebhookEvent.PULLREQUEST_APPROVED, body);
        });
        dispatcher.on(WebhookEvent.PULLREQUEST_UNAPPROVED, (body: PullRequestWithActor) => {
            SocketServer.onWebhookEvent(WebhookEvent.PULLREQUEST_UNAPPROVED, body);
        });
        dispatcher.on(WebhookEvent.PULLREQUEST_FULFILLED, (body: PullRequestWithActor) => {
            SocketServer.onWebhookEvent(WebhookEvent.PULLREQUEST_FULFILLED, body);
        });
        dispatcher.on(WebhookEvent.PULLREQUEST_REJECTED, (body: PullRequestWithActor) => {
            SocketServer.onWebhookEvent(WebhookEvent.PULLREQUEST_REJECTED, body);
        });
    }

    static stopSocketServer(): void {
        this.io.close();
    }

    private static onWebhookEvent(eventName: string, pullRequestWithActor: PullRequestWithActor): void {
        logger.logWebhookEventReceived(eventName);
        const pullRequest = pullRequestWithActor.pullRequest;
        const actor = pullRequestWithActor.actor;
        const author = pullRequest.author.username;

        const userPullRequests = new PullRequestEvent();
        userPullRequests.actor = actor;
        userPullRequests.sourceEvent = eventName;
        userPullRequests.context = pullRequest;
        // @todo Bring back authored and assigned pull requests
        userPullRequests.pullRequests = PullRequestRepository.findByUser(author);

        logger.logEmittingEventToUser(SocketServerEvent.PULLREQUESTS_UPDATED, author);
        SocketServer.io.to(author).emit(SocketServerEvent.PULLREQUESTS_UPDATED, userPullRequests);

        const reviewers: Reviewer[] = pullRequest.reviewers || [];

        let reviewerIdx = 0, reviewersLength = reviewers.length;
        for (; reviewerIdx < reviewersLength; reviewerIdx++) {
            const reviewerUsername = reviewers[reviewerIdx].user.username;
            const reviewerPr = new PullRequestEvent();
            reviewerPr.sourceEvent = eventName;
            reviewerPr.actor = actor;
            reviewerPr.context = pullRequest;
            // @todo Bring back authored and assigned pull requests
            reviewerPr.pullRequests = PullRequestRepository.findByUser(reviewerUsername);

            logger.logEmittingEventToUser(SocketServerEvent.PULLREQUESTS_UPDATED, reviewerUsername);
            SocketServer.io.to(reviewerUsername).emit(SocketServerEvent.PULLREQUESTS_UPDATED, reviewerPr);
        }
    }

    /**
     * @todo Add logger
     * @param pullRequestWithActor
     */
    private static onWebhookPullRequestUpdated(pullRequestWithActor: PullRequestWithActor) {
        const pullRequest = pullRequestWithActor.pullRequest;

        const reviewers = pullRequest.reviewers || [];
        for (const reviewer of reviewers) {
            const reviewerUsername = reviewer.user.username;
            SocketServer.io.to(reviewerUsername).emit(SocketServerEvent.PULLREQUEST_UPDATED, pullRequest);
        }
    }
}
