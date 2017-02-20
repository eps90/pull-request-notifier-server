import {HandlerInterface} from "./handler";
import {UserFactory} from "../../factory/user";
import {PullRequestRepository} from "../../repository/pull_request_repository";
import {PullRequestWithActor} from "../../model/pull_request_with_actor";
import logger from '../../logger';

export class PullRequestCreationHandler implements HandlerInterface {
    private supportedEventName: string = 'pullrequest:created';

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
                logger.logAddPullRequestToRepository();
                PullRequestRepository.add(pullRequestWithActor.pullRequest);
                return pullRequestWithActor;
            });
    }

    supportsEvent(eventType: string): boolean {
        return eventType === this.supportedEventName;
    }
}
