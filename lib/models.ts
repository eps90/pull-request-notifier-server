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

export class WebhookEvent {
    static PULLREQUEST_CREATED: string = 'webhook:pullrequest:created';
    static PULLREQUEST_UPDATED: string = 'webhook:pullrequest:updated';
    static PULLREQUEST_APPROVED: string = 'webhook:pullrequest:approved';
    static PULLREQUEST_UNAPPROVED: string = 'webhook:pullrequest:unapproved';
    static PULLREQUEST_FULFILLED: string = 'webhook:pullrequest:fulfilled';
    static PULLREQUEST_REJECTED: string = 'webhook:pullrequest:rejected';
}

export class SocketClientEvent {
    static INTRODUCE: string = 'client:introduce';
}

export class SocketServerEvent {
    static PULLREQUESTS_UPDATED: string = 'server:pullrequests:updated';
    static INTRODUCED: string = 'server:introduced';
}
