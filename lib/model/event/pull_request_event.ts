import {User} from "../user";
import {PullRequest} from "../pull_request";

export class PullRequestEvent {
    actor: User = new User();
    sourceEvent: string = '';
    context: PullRequest = new PullRequest();
    pullRequests: Array<PullRequest> = [];
}
