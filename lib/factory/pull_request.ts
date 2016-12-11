import {PullRequest, PullRequestState} from "../model";
import {UserFactory} from "./user";
import {ReviewerFactory} from "./reviewer";
import {PullRequestLinksFactory} from "./pull_request_links";
import {ProjectFactory} from "./project";

export class PullRequestFactory {
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
