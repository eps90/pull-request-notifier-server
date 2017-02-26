import {HandlerInterface} from "./handler";
import {UserFactory} from "../../factory/user";
import {PullRequestRepository} from "../../repository/pull_request_repository";
import {PullRequestWithActor} from "../../model/pull_request_with_actor";
import logger from '../../logger';
import {EventDispatcher} from "../../events/event_dispatcher";

export class UpdatePullRequestHandler implements HandlerInterface {
    private supportedEvents: string[] = [
        'pullrequest:updated',
        'pullrequest:approved',
        'pullrequest:unapproved'
    ];

    handlePayload(type: string, bodyDecoded: any): Q.Promise<any> {
        const prLink = bodyDecoded.pullrequest.links.self.href;
        const actor = UserFactory.create(bodyDecoded.actor);

        return PullRequestRepository.fetchOne(prLink)
            .then((pullRequest) => {
                const prWithActor = new PullRequestWithActor();
                prWithActor.pullRequest = pullRequest;
                prWithActor.actor = actor;

                return prWithActor;
            })
            .then((pullRequestWithActor: PullRequestWithActor) => {
                logger.logUpdatingPullRequest();
                PullRequestRepository.update(pullRequestWithActor.pullRequest);
                return pullRequestWithActor;
            })
            .then((pullRequestWithActor: PullRequestWithActor) => {
                const eventName = `webhook:${type}`;
                EventDispatcher.getInstance().emit(eventName, pullRequestWithActor);
            });
    }

    supportsEvent(eventType: string): boolean {
        return this.supportedEvents.indexOf(eventType) !== -1;
    }
}
