/// <reference path="../typings/tsd.d.ts" />

export interface ModelInterface {}

// @todo Rename to Project
export class Repository implements ModelInterface {
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
    user: User;
}

export enum PullRequestState {Open, Merged, Declined}

export class PullRequest implements ModelInterface {
    title: string;
    description: string;
    author: User;
    targetRepository: Repository;
    targetBranch: string;
    reviewers: Array<Reviewer> = [];
    state: PullRequestState;
}
