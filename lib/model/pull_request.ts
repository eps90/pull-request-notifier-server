import {User} from "./user";
import {Project} from "./project";
import {Reviewer} from "./reviewer";
import {PullRequestState} from "./pull_request_state";
import {PullRequestLinks} from "./pull_request_links";

export class PullRequest {
    uuid: string;
    id: number;
    title: string;
    description: string;
    author: User = new User();
    targetRepository: Project = new Project();
    targetBranch: string;
    reviewers: Array<Reviewer> = [];
    state: PullRequestState;
    links: PullRequestLinks = new PullRequestLinks();
}
