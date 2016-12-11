// @todo To review whole process - how it is consumed, does it need improvements, if so, which ones?

import {HandlerInterface} from "./handler";
import {PullRequestWithActor} from "../../model/pull_request_with_actor";
import {UserFactory} from "../../factory/user";
import {PullRequestRepository} from "../../repository/pull_request_repository";
import logger from './../../logger';

import * as q from 'q';
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
