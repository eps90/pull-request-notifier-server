/// <reference path="../typings/tsd.d.ts" />

export class Repository {
    name:string = '';
    fullName:string = '';

    constructor(repoObject?: any) {
        if (repoObject.hasOwnProperty('name')) {
            this.name = repoObject.name;
        }

        if (repoObject.hasOwnProperty('full_name')) {
            this.fullName = repoObject.full_name;
        }
    }
}

export class User {
    username:string;
    displayName:string;

    constructor(userObject?: any) {
        if (userObject.hasOwnProperty('username')) {
            this.username = userObject.username;
        }

        if (userObject.hasOwnProperty('display_name')) {
            this.displayName = userObject.display_name;
        }
    }
}

export class Reviewer {
    approved:boolean;
    user: User;

    constructor(reviewerObject?: any) {
        if (reviewerObject.hasOwnProperty('approved')) {
            this.approved = reviewerObject.approved;
        }

        if (reviewerObject.hasOwnProperty('user')) {
            this.user = new User(reviewerObject.user);
        }
    }
}

export enum PullRequestState {Open, Merged, Declined}

export class PullRequest {
    title:string;
    description:string;
    author:User;
    targetRepository:Repository;
    targetBranch:string;
    reviewers:Array<Reviewer> = [];
    state:PullRequestState;

    constructor(prObject?: any) {
        if (prObject.hasOwnProperty('title')) {
            this.title = prObject.title;
        }

        if (prObject.hasOwnProperty('description')) {
            this.description = prObject.description;
        }

        if (prObject.hasOwnProperty('author')) {
            this.author = new User(prObject.author);
        }

        if (prObject.hasOwnProperty('destination')) {
            var destinationObj = prObject.destination;
            if (destinationObj.hasOwnProperty('repository')) {
                this.targetRepository = new Repository(destinationObj.repository);
            }

            if (destinationObj.hasOwnProperty('branch')) {
                this.targetBranch = destinationObj.branch.name;
            }
        }

        if (prObject.hasOwnProperty('state')) {
            this.state = PullRequest.getPullRequestState(prObject.state);
        }

        if (prObject.hasOwnProperty('participants')) {
            for (var participantIndex:number = 0; participantIndex < prObject.participants.length; participantIndex++) {
                var participant:any = prObject.participants[participantIndex];
                if (participant.role == 'REVIEWER') {
                    this.reviewers.push(new Reviewer(participant));
                }
            }
        }
    }

    private static getPullRequestState(prState:string):PullRequestState {
        var state:PullRequestState;
        switch (prState.toUpperCase()) {
            case 'OPEN':
                state = PullRequestState.Open;
                break;
            case 'MERGED':
                state = PullRequestState.Merged;
                break;
            case 'DECLINED':
                state = PullRequestState.Declined;
                break;
            default:
                throw new Error('Invalid pull request state');
                break;
        }

        return state;
    }
}
