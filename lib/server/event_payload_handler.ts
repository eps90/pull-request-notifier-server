// @todo To review whole process - how it is consumed, does it need improvements, if so, which ones?

import {PullRequestRepository} from '../repository';
import {UserFactory} from '../factory';
import {EventDispatcher} from '../events/event_dispatcher';
import logger from './../logger';
import {PullRequestWithActor} from './../model';
import * as q from 'q';

export interface HandlerInterface {
    handlePayload(type: string, bodyDecoded: any): q.Promise<any>;
    supportsEvent(eventType: string): boolean;
}

export class PullRequestHandler implements HandlerInterface {
    private supportedEvents = [
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

    handlePayload(type: string, payload: any): q.Promise<PullRequestWithActor> {
        const prLink = payload.pullrequest.links.self.href;
        const actor = UserFactory.create(payload.actor);

        return PullRequestRepository.fetchOne(prLink)
            .then((pullRequest) => {
                const prWithActor = new PullRequestWithActor();
                prWithActor.pullRequest = pullRequest;
                prWithActor.actor = actor;

                return prWithActor;
            })
            .then((pullRequestWithActor: PullRequestWithActor) => {
                switch (type) {
                    case this.PULLREQUEST_CREATED:
                        return this.onPullRequestCreated(pullRequestWithActor);
                    case this.PULLREQUEST_UPDATED:
                    case this.PULLREQUEST_APPROVED:
                    case this.PULLREQUEST_UNAPPROVED:
                        return this.onPullRequestUpdated(pullRequestWithActor);
                    case this.PULLREQUEST_FULFILLED:
                    case this.PULLREQUEST_REJECTED:
                        return this.onPullRequestClosed(pullRequestWithActor);
                    default:
                        logger.logUnhandledEventPayload(type);
                        return pullRequestWithActor;
                }
            });
    }

    supportsEvent(eventType: string): boolean {
        return this.supportedEvents.indexOf(eventType) !== -1;
    }

    private onPullRequestCreated(pullRequestWithActor: PullRequestWithActor): PullRequestWithActor {
        logger.logAddPullRequestToRepository();
        PullRequestRepository.add(pullRequestWithActor.pullRequest);
        return pullRequestWithActor;
    }

    private onPullRequestUpdated(pullRequestWithActor: PullRequestWithActor): PullRequestWithActor {
        logger.logUpdatingPullRequest();
        PullRequestRepository.update(pullRequestWithActor.pullRequest);
        return pullRequestWithActor;
    }

    private onPullRequestClosed(pullRequestWithActor: PullRequestWithActor): PullRequestWithActor {
        logger.logClosingPullRequest();
        PullRequestRepository.remove(pullRequestWithActor.pullRequest);
        return pullRequestWithActor;
    }
}

export class EventPayloadHandler {
    private static handlers: HandlerInterface[] = [
        new PullRequestHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): q.Promise<any> {
        const bodyDecoded = JSON.parse(bodyEncoded);
        const deferred = q.defer();
        const handlers: HandlerInterface[] = this.handlers.filter(handler => handler.supportsEvent(type));

        q.all(
            handlers.map((handler: HandlerInterface) => {
                return q.Promise((resolve) => {
                    handler.handlePayload(type, bodyDecoded).then((handleResult) => {
                        this.triggerEvent(type, handleResult);
                        resolve(null);
                    });
                });
            })
        ).then(() => {
            deferred.resolve(null);
        });

        return deferred.promise;
    }

    private static triggerEvent(payloadType: string, contents: any = {}): void {
        const eventName = 'webhook:' + payloadType;
        EventDispatcher.getInstance().emit(eventName, contents);
    }
}
