///<reference path="../../typings/tsd.d.ts"/>
// @todo To review whole process - how it is consumed, does it need improvements, if so, which ones?

import repositories = require('./../repositories');
import factories = require('./../factories');
import logger = require('./../logger');
import eventDispatcher = require('./../events/event_dispatcher');
import models = require('./../models');
import q = require('q');

export interface HandlerInterface {
    supportedEvents: Array<string>;
    handlePayload(type: string, bodyDecoded: any): q.Promise<any>;
    prepareBody(bodyEncoded: any): q.Promise<any>;
}

export class PullRequestWithActor {
    pullRequest: models.PullRequest = new models.PullRequest();
    actor: models.User = new models.User();
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

    handlePayload(type: string, pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        var deferred = q.defer<PullRequestWithActor>();

        switch (type) {
            case this.PULLREQUEST_CREATED:
                this.onPullRequestCreated(pullRequestWithActor).then(() => {
                    deferred.resolve(pullRequestWithActor);
                });
                break;
            case this.PULLREQUEST_UPDATED:
            case this.PULLREQUEST_APPROVED:
            case this.PULLREQUEST_UNAPPROVED:
                this.onPullRequestUpdated(pullRequestWithActor).then(() => {
                    deferred.resolve(pullRequestWithActor);
                });
                break;
            case this.PULLREQUEST_FULFILLED:
            case this.PULLREQUEST_REJECTED:
                this.onPullRequestClosed(pullRequestWithActor).then(() => {
                    deferred.resolve(pullRequestWithActor);
                });
                break;
            default:
                logger.logUnhandledEventPayload(type);
                deferred.resolve(pullRequestWithActor);
                return;
        }

        return deferred.promise;
    }

    prepareBody(bodyDecoded): q.Promise<PullRequestWithActor> {
        var deferred = q.defer<PullRequestWithActor>();
        var dummyPr = factories.PullRequestFactory.create(bodyDecoded.pullrequest);
        var actor = factories.UserFactory.create(bodyDecoded.actor);
        repositories.PullRequestRepository.fetchOne(dummyPr.links.self).then((pullRequest: models.PullRequest) => {
            var prWithActor = new PullRequestWithActor();
            prWithActor.pullRequest = pullRequest;
            prWithActor.actor = actor;
            deferred.resolve(prWithActor);
        });
        return deferred.promise;
    }

    private onPullRequestCreated(pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        var deferred = q.defer<PullRequestWithActor>();
        logger.logAddPullRequestToRepository();
        repositories.PullRequestRepository.add(pullRequestWithActor.pullRequest);
        deferred.resolve(pullRequestWithActor);
        return deferred.promise;
    }

    private onPullRequestUpdated(pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        var deferred = q.defer<PullRequestWithActor>();
        logger.logUpdatingPullRequest();
        repositories.PullRequestRepository.update(pullRequestWithActor.pullRequest);
        deferred.resolve(pullRequestWithActor);
        return deferred.promise;
    }

    private onPullRequestClosed(pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        var deferred = q.defer<PullRequestWithActor>();
        logger.logClosingPullRequest();
        repositories.PullRequestRepository.remove(pullRequestWithActor.pullRequest);
        deferred.resolve(pullRequestWithActor);
        return deferred.promise;
    }
}

export class EventPayloadHandler {
    private static handlers: Array<HandlerInterface> = [
        new PullRequestHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): q.Promise<any> {
        var bodyDecoded = JSON.parse(bodyEncoded);
        var deferred = q.defer();
        var handlers: Array<HandlerInterface> = this.handlers.filter((handler: HandlerInterface) => {
             return handler.supportedEvents.indexOf(type) !== -1;
        });

        q.all(
            handlers.map((handler: HandlerInterface) => {
                var handlerDefer = q.defer();

                handler.prepareBody(bodyDecoded).then((preparedBody) => {
                    handler.handlePayload(type, preparedBody).then(() => {
                        this.triggerEvent(type, preparedBody);
                        handlerDefer.resolve(true);
                    });
                });

                return handlerDefer.promise;
            })
        ).then(() => {
            deferred.resolve(true);
        });

        return deferred.promise;
    }

    private static triggerEvent(payloadType: string, contents: any = {}): void {
        var eventName = 'webhook:' + payloadType;
        eventDispatcher.EventDispatcher.getInstance().emit(eventName, contents);
    }
}
