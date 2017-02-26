import {PullRequest} from "./pull_request";
import {User} from "./user";

export class PullRequestWithActor {
    pullRequest: PullRequest = new PullRequest();
    actor: User = new User();
}
