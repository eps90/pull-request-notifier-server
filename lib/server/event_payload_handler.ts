///<reference path="../../typings/tsd.d.ts"/>

import repositories = require('./../repositories');
import factories = require('./../factories');
import logger = require('./../logger');

export class EventPayloadHandler {
    private static PULLREQUEST_CREATED = 'pullrequest:created';
    private static PULLREQUEST_UPDATED = 'pullrequest:updated';

    private static PULLREQUEST_FULFILLED = 'pullrequest:fulfilled';
    private static PULLREQUEST_REJECTED = 'pullrequest:rejected';

    private static PULLREQUEST_APPROVED = 'pullrequest:approved';
    private static PULLREQUEST_UNAPPROVED = 'pullrequest:unapproved';

    static handlePayload(type: string, body: string) {
        var parsedBody = JSON.parse(body);
        switch (type) {
            case this.PULLREQUEST_CREATED:
                this.onPullRequestCreated(parsedBody);
                break;
            case this.PULLREQUEST_UPDATED:
            case this.PULLREQUEST_APPROVED:
            case this.PULLREQUEST_UNAPPROVED:
                this.onPullRequestUpdated(parsedBody);
                break;
            case this.PULLREQUEST_FULFILLED:
            case this.PULLREQUEST_REJECTED:
                this.onPullRequestClosed(parsedBody);
                break;
            default:
                logger.info('Unhandled event payload: ' + type);
                break;
        }
    }

    private static onPullRequestCreated(body: any) {
        logger.info('Adding a pull request to the repository');
        var newPullRequest = factories.PullRequestFactory.create(body.pullrequest);
        repositories.PullRequestRepository.add(newPullRequest);
    }

    private static onPullRequestUpdated(body: any) {
        logger.info('Updating a pull request');
        var pullRequest = factories.PullRequestFactory.create(body.pullrequest);
        repositories.PullRequestRepository.update(pullRequest);
    }

    private static onPullRequestClosed(body: any) {
        logger.info('Closing a pull request');
        var pullRequest = factories.PullRequestFactory.create(body.pullrequest);
        repositories.PullRequestRepository.remove(pullRequest);
    }
}
