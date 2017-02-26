import {PullRequest} from "./pull_request";
import {User} from "./user";
import {Comment} from "./comment";

export class PullRequestWithComment {
    pullRequest: PullRequest;
    actor: User;
    comment: Comment;
}
