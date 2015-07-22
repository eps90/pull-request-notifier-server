///<reference path="../typings/tsd.d.ts"/>

import models = require('./../lib/models');

export interface FactoryInterface {}

export class ProjectFactory implements FactoryInterface {
    static create(rawObject: any): models.Project {
        var project = new models.Project();

        if (rawObject.hasOwnProperty('name')) {
            project.name = rawObject.name;
        }

        if (rawObject.hasOwnProperty('full_name')) {
            project.fullName = rawObject.full_name;
        }

        if (rawObject.hasOwnProperty('links')) {
            var links = rawObject.links;
            if (links.hasOwnProperty('pullrequests')) {
                project.pullRequestsUrl = rawObject.links.pullrequests.href;
            }
        }

        return project;
    }
}

export class UserFactory implements FactoryInterface {
    static create(rawObject: any): models.User {
        var user = new models.User();

        if (rawObject.hasOwnProperty('username')) {
            user.username = rawObject.username;
        }

        if (rawObject.hasOwnProperty('display_name')) {
            user.displayName = rawObject.display_name;
        }

        return user;
    }
}

export class ReviewerFactory implements FactoryInterface {
    static create(rawObject: any): models.Reviewer {
        var reviewer = new models.Reviewer();

        if (rawObject.hasOwnProperty('approved')) {
            reviewer.approved = rawObject.approved;
        }

        if (rawObject.hasOwnProperty('user')) {
            reviewer.user = UserFactory.create(rawObject.user);
        }

        return reviewer;
    }
}

export class PullRequestFactory implements FactoryInterface {
    static create(rawObject: any): models.PullRequest {
        var pullRequest = new models.PullRequest();

        if (rawObject.hasOwnProperty('title')) {
            pullRequest.title = rawObject.title;
        }

        if (rawObject.hasOwnProperty('description')) {
            pullRequest.description = rawObject.description;
        }

        if (rawObject.hasOwnProperty('author')) {
            pullRequest.author = UserFactory.create(rawObject.author);
        }

        if (rawObject.hasOwnProperty('destination')) {
            var destinationObj = rawObject.destination;
            if (destinationObj.hasOwnProperty('repository')) {
                pullRequest.targetRepository = ProjectFactory.create(destinationObj.repository);
            }

            if (destinationObj.hasOwnProperty('branch')) {
                pullRequest.targetBranch = destinationObj.branch.name;
            }
        }

        if (rawObject.hasOwnProperty('state')) {
            pullRequest.state = PullRequestFactory.getPullRequestState(rawObject.state);
        }

        if (rawObject.hasOwnProperty('participants')) {
            for (var participantIndex: number = 0; participantIndex < rawObject.participants.length; participantIndex++) {
                var participant: any = rawObject.participants[participantIndex];
                if (participant.role === 'REVIEWER') {
                    pullRequest.reviewers.push(ReviewerFactory.create(participant));
                }
            }
        }

        return pullRequest;
    }

    private static getPullRequestState(prState: string): models.PullRequestState {
        var state: models.PullRequestState;
        switch (prState.toUpperCase()) {
            case 'OPEN':
                state = models.PullRequestState.Open;
                break;
            case 'MERGED':
                state = models.PullRequestState.Merged;
                break;
            case 'DECLINED':
                state = models.PullRequestState.Declined;
                break;
            default:
                throw new Error('Invalid pull request state');
        }

        return state;
    }

}
