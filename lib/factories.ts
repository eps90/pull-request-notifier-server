import {Project, User, Reviewer, PullRequest, PullRequestLinks, PullRequestState} from './models';

export interface FactoryInterface {}

export class ProjectFactory implements FactoryInterface {
    static create(rawObject: any): Project {
        const project = new Project();

        if (rawObject.hasOwnProperty('name')) {
            project.name = rawObject.name;
        }

        if (rawObject.hasOwnProperty('full_name')) {
            project.fullName = rawObject.full_name;
        }

        if (rawObject.hasOwnProperty('links')) {
            const links = rawObject.links;
            if (links.hasOwnProperty('pullrequests')) {
                project.pullRequestsUrl = rawObject.links.pullrequests.href;
            }
        }

        return project;
    }
}

export class UserFactory implements FactoryInterface {
    static create(rawObject: any): User {
        const user = new User();

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
    static create(rawObject: any): Reviewer {
        const reviewer = new Reviewer();

        if (rawObject.hasOwnProperty('approved')) {
            reviewer.approved = rawObject.approved;
        }

        if (rawObject.hasOwnProperty('user')) {
            reviewer.user = UserFactory.create(rawObject.user);
        }

        return reviewer;
    }
}

export class PullRequestLinksFactory implements FactoryInterface {
    static create(rawObject: any): PullRequestLinks {
        const links = new PullRequestLinks();

        if (rawObject.hasOwnProperty('self') && rawObject.self.hasOwnProperty('href')) {
            links.self = rawObject.self.href;
        }

        if (rawObject.hasOwnProperty('html') && rawObject.html.hasOwnProperty('href')) {
            links.html = rawObject.html.href;
        }

        return links;
    }
}

export class PullRequestFactory implements FactoryInterface {
    static create(rawObject: any): PullRequest {
        const pullRequest = new PullRequest();

        if (rawObject.hasOwnProperty('id')) {
            pullRequest.id = rawObject.id;
        }

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
            const destinationObj = rawObject.destination;
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
            for (let participantIndex: number = 0; participantIndex < rawObject.participants.length; participantIndex++) {
                const participant: any = rawObject.participants[participantIndex];
                if (participant.role === 'REVIEWER') {
                    pullRequest.reviewers.push(ReviewerFactory.create(participant));
                }
            }
        }

        if (rawObject.hasOwnProperty('links')) {
            pullRequest.links = PullRequestLinksFactory.create(rawObject.links);
        }

        return pullRequest;
    }

    private static getPullRequestState(prState: string): PullRequestState {
        let state: PullRequestState;
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
        }

        return state;
    }
}
