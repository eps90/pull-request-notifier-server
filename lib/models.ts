/// <reference path="../typings/tsd.d.ts" />

export interface ModelInterface {}

export class Project implements ModelInterface {
    name: string;
    fullName: string;
    pullRequestsUrl: string;
}

export class User implements ModelInterface {
    username: string;
    displayName: string;
}

export class Reviewer implements ModelInterface {
    approved: boolean;
    user: User = new User();
}

export enum PullRequestState {Open, Merged, Declined}

export class PullRequestLinks {
    self: string;
    html: string;
}

export class PullRequest implements ModelInterface {
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

export class PullRequestEvent {
    actor: User = new User();
    sourceEvent: string = '';
    context: PullRequest = new PullRequest();
    pullRequests: Array<PullRequest> = [];
}
