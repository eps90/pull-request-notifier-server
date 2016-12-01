// @todo To review whole process - how it is consumed, does it need improvements, if so, which ones?

import {PullRequestRepository} from '../repositories';
import {PullRequestFactory, UserFactory} from '../factories';
import {EventDispatcher} from '../events/event_dispatcher';
import logger = require('./../logger');
import {PullRequest, User} from '../models';
import * as q from 'q';

export interface HandlerInterface {
    supportedEvents: Array<string>;
    handlePayload(type: string, bodyDecoded: any): q.Promise<any>;
    prepareBody(bodyEncoded: any): q.Promise<any>;
}

export class PullRequestWithActor {
    pullRequest: PullRequest = new PullRequest();
    actor: User = new User();
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
        const deferred = q.defer<PullRequestWithActor>();

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
        const deferred = q.defer<PullRequestWithActor>();
        const dummyPr = PullRequestFactory.create(bodyDecoded.pullrequest);
        const actor = UserFactory.create(bodyDecoded.actor);
        PullRequestRepository.fetchOne(dummyPr.links.self).then((pullRequest: PullRequest) => {
            const prWithActor = new PullRequestWithActor();
            prWithActor.pullRequest = pullRequest;
            prWithActor.actor = actor;
            deferred.resolve(prWithActor);
        });
        return deferred.promise;
    }

    private onPullRequestCreated(pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        const deferred = q.defer<PullRequestWithActor>();
        logger.logAddPullRequestToRepository();
        PullRequestRepository.add(pullRequestWithActor.pullRequest);
        deferred.resolve(pullRequestWithActor);
        return deferred.promise;
    }

    private onPullRequestUpdated(pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        const deferred = q.defer<PullRequestWithActor>();
        logger.logUpdatingPullRequest();
        PullRequestRepository.update(pullRequestWithActor.pullRequest);
        deferred.resolve(pullRequestWithActor);
        return deferred.promise;
    }

    private onPullRequestClosed(pullRequestWithActor: PullRequestWithActor): q.Promise<PullRequestWithActor> {
        const deferred = q.defer<PullRequestWithActor>();
        logger.logClosingPullRequest();
        PullRequestRepository.remove(pullRequestWithActor.pullRequest);
        deferred.resolve(pullRequestWithActor);
        return deferred.promise;
    }
}

export class EventPayloadHandler {
    private static handlers: Array<HandlerInterface> = [
        new PullRequestHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): q.Promise<any> {
        const bodyDecoded = JSON.parse(bodyEncoded);
        const deferred = q.defer();
        const handlers: Array<HandlerInterface> = this.handlers.filter((handler: HandlerInterface) => {
            return handler.supportedEvents.indexOf(type) !== -1;
        });

        q.all(
            handlers.map((handler: HandlerInterface) => {
                const handlerDefer = q.defer();

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
        const eventName = 'webhook:' + payloadType;
        EventDispatcher.getInstance().emit(eventName, contents);
    }
}
