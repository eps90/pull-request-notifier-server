///<reference path="../../typings/tsd.d.ts"/>

import repositories = require('./../repositories');
import factories = require('./../factories');
import logger = require('./../logger');
import eventDispatcher = require('./../events/event_dispatcher');
import models = require('./../models');
import q = require('q');

export interface HandlerInterface {
    supportedEvents: Array<string>;
    handlePayload(type: string, bodyDecoded: any): q.Promise<any>;
    prepareBody(bodyEncoded: any): any;
}

export class PullRequestHandler implements HandlerInterface {
    supportedEvents: Array<string> = [
        'pullrequest:created',
        'pullrequest:updated',
        'pullrequest:fulfilled',
        'pullrequest:rejected',
        'pullrequest:approved',
        'pullrequest:unapproved',
    ];

    private PULLREQUEST_CREATED: string = 'pullrequest:created';
    private PULLREQUEST_UPDATED: string = 'pullrequest:updated';

    private PULLREQUEST_FULFILLED: string = 'pullrequest:fulfilled';
    private PULLREQUEST_REJECTED: string = 'pullrequest:rejected';

    private PULLREQUEST_APPROVED: string = 'pullrequest:approved';
    private PULLREQUEST_UNAPPROVED: string = 'pullrequest:unapproved';

    handlePayload(type: string, bodyDecoded: any): q.Promise<any> {
        var deferred = q.defer();

        switch (type) {
            case this.PULLREQUEST_CREATED:
                this.onPullRequestCreated(bodyDecoded).then(() => {
                    deferred.resolve(bodyDecoded);
                });
                break;
            case this.PULLREQUEST_UPDATED:
            case this.PULLREQUEST_APPROVED:
            case this.PULLREQUEST_UNAPPROVED:
                this.onPullRequestUpdated(bodyDecoded).then(() => {
                    deferred.resolve(bodyDecoded);
                });
                break;
            case this.PULLREQUEST_FULFILLED:
            case this.PULLREQUEST_REJECTED:
                this.onPullRequestClosed(bodyDecoded).then(() => {
                    deferred.resolve(bodyDecoded);
                });
                break;
            default:
                logger.info('Unhandled event payload: ' + type);
                deferred.resolve(bodyDecoded);
                return;
        }

        return deferred.promise;
    }

    prepareBody(bodyDecoded): models.PullRequest {
        return factories.PullRequestFactory.create(bodyDecoded.pullrequest);
    }

    private onPullRequestCreated(pullRequest: models.PullRequest): q.Promise<models.PullRequest> {
        var deferred = q.defer<models.PullRequest>();
        logger.info('Adding a pull request to the repository');
        repositories.PullRequestRepository.add(pullRequest);
        deferred.resolve(pullRequest);
        return deferred.promise;
    }

    private onPullRequestUpdated(pullRequest: models.PullRequest): q.Promise<models.PullRequest> {
        var deferred = q.defer<models.PullRequest>();
        logger.info('Updating a pull request');
        repositories.PullRequestRepository.update(pullRequest);
        deferred.resolve(pullRequest);
        return deferred.promise;
    }

    private onPullRequestClosed(pullRequest: models.PullRequest): q.Promise<models.PullRequest> {
        var deferred = q.defer<models.PullRequest>();
        logger.info('Closing a pull request');
        repositories.PullRequestRepository.remove(pullRequest);
        deferred.resolve(pullRequest);
        return deferred.promise;
    }
}

export class EventPayloadHandler {
    private static handlers: Array<HandlerInterface> = [
        new PullRequestHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): void {
        var bodyDecoded = JSON.parse(bodyEncoded);
        for (var handlerIndex = 0; handlerIndex < this.handlers.length; handlerIndex++) {
            var handler: HandlerInterface = this.handlers[handlerIndex];
            if (handler.supportedEvents.indexOf(type) !== -1) {
                var preparedBody = handler.prepareBody(bodyDecoded);
                handler.handlePayload(type, preparedBody).then(() => {
                    this.triggerEvent(type, preparedBody);
                });
            }
        }
    }

    private static triggerEvent(payloadType: string, contents: any = {}): void {
        var eventName = 'webhook:' + payloadType;
        eventDispatcher.EventDispatcher.getInstance().emit(eventName, contents);
    }
}
