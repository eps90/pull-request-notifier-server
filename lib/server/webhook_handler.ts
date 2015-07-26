///<reference path="../../typings/tsd.d.ts"/>

import repositories = require('./../repositories');
import factories = require('./../factories');

export class WebhookHandler {
    static handlePayload(type: string, body: string) {
        var parsedBody = JSON.parse(body);
        switch (type) {
            case 'pullrequest:created':
                this.onPullRequestCreated(parsedBody);
                break;
        }
    }

    private static onPullRequestCreated(body: any) {
        var newPullRequest = factories.PullRequestFactory.create(body.pullrequest);
        repositories.PullRequestRepository.add(newPullRequest);
    }
}
