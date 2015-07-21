///<reference path="../typings/tsd.d.ts"/>

import models = require('./../lib/models');

// @todo Make ::create method static
export interface FactoryInterface {
    create(rawObject: any): models.ModelInterface;
}

export class ProjectFactory implements FactoryInterface {
    create(rawObject: any): models.Repository {
        var project = new models.Repository();

        if (rawObject.hasOwnProperty('name')) {
            project.name = rawObject.name;
        }

        if (rawObject.hasOwnProperty('full_name')) {
            project.fullName = rawObject.full_name;
        }

        if (rawObject.hasOwnProperty('links')) {
            project.pullRequestsUrl = rawObject.links.pullrequests.href;
        }

        return project;
    }
}

export class UserFactory implements FactoryInterface {
    create(rawObject: any): models.User {
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
    create(rawObject: any): models.Reviewer {
        var reviewer = new models.Reviewer();

        if (rawObject.hasOwnProperty('approved')) {
            reviewer.approved = rawObject.approved;
        }

        if (rawObject.hasOwnProperty('user')) {
            var userFactory = new UserFactory();
            reviewer.user = userFactory.create(rawObject.user);
        }

        return reviewer;
    }
}

export class PullRequestFactory implements FactoryInterface {
    create(rawObject: any): models.PullRequest {
        var pullRequest = new models.PullRequest();

        if (rawObject.hasOwnProperty('title')) {
            pullRequest.title = rawObject.title;
        }

        if (rawObject.hasOwnProperty('description')) {
            pullRequest.description = rawObject.description;
        }

        if (rawObject.hasOwnProperty('author')) {
            var userFactory = new UserFactory();
            pullRequest.author = userFactory.create(rawObject.author);
        }

        if (rawObject.hasOwnProperty('destination')) {
            var destinationObj = rawObject.destination;
            if (destinationObj.hasOwnProperty('repository')) {
                var projectFactory = new ProjectFactory();
                pullRequest.targetRepository = projectFactory.create(destinationObj.repository);
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
                    var reviewerFactory = new ReviewerFactory();
                    pullRequest.reviewers.push(reviewerFactory.create(participant));
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
