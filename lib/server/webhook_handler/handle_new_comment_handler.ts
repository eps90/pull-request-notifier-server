import {HandlerInterface} from "./handler";
import {PullRequestRepository} from "../../repository/pull_request_repository";
import {UserFactory} from "../../factory/user";
import {PullRequest} from "../../model/pull_request";
import {PullRequestWithComment} from "../../model/pull_request_with_comment";
import {CommentFactory} from "../../factory/comment";
import {EventDispatcher} from "../../events/event_dispatcher";
import {WebhookEvent} from "../../model/event/webhook_event";

export class HandleNewCommentHandler implements HandlerInterface {
    private supportedEvents: string[] = [
        'pullrequest:comment_created'
    ];

    handlePayload(type: string, bodyDecoded: any): Q.Promise<any> {
        const pullRequestWithComment = new PullRequestWithComment();
        pullRequestWithComment.actor = UserFactory.create(bodyDecoded.actor);
        pullRequestWithComment.comment = CommentFactory.create(bodyDecoded.comment);

        const pullRequestLink = bodyDecoded.pullrequest.links.self.href;
        return PullRequestRepository.fetchOne(pullRequestLink)
            .then((pullRequest: PullRequest) => {
                pullRequestWithComment.pullRequest = pullRequest;
                return pullRequestWithComment;
            })
            .then((pullRequestWithComment: PullRequestWithComment) => {
                EventDispatcher.getInstance().emit(WebhookEvent.PULLREQUEST_COMMENTED, pullRequestWithComment);
            });
    }

    supportsEvent(eventType: string): boolean {
        return this.supportedEvents.indexOf(eventType) !== -1;
    }
}
