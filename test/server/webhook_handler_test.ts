///<reference path="../../typings/tsd.d.ts"/>

import chai = require('chai');
var expect = chai.expect;

import models = require('./../../lib/models');
import repositories = require('./../../lib/repositories');
import webhookHandler = require('./../../lib/server/webhook_handler');

describe('Webhook listener', () => {
    beforeEach(() => {
        repositories.PullRequestRepository.pullRequests = {};
    });

    it('should create add new pull request to repository on pullrequest:created', () => {
        var eventType = 'pullrequest:created';
        var payload = {
            pullrequest: {
                "id" :  1 ,
                "title" :  "Title of pull request" ,
                "description" :  "Description of pull request" ,
                "state" :  "OPEN" ,
                "author" : {
                    "username": "emmap1",
                    "display_name": "Emma"
                },
                "destination" : {
                    "branch" : {  "name" :  "master" },
                    "repository" : {
                        "full_name": "team_name/repo_name",
                        "name": "repo_name"
                    }
                },
                "participants" : [
                    // @todo
                ],
                "links": {
                    "self": {
                        "href": "https://api.bitbucket.org/api/2.0/pullrequests/1"
                    }
                }
            }
        };

        var payloadString = JSON.stringify(payload);
        webhookHandler.WebhookHandler.handlePayload(eventType, payloadString);

        var pullRequests: Array<models.PullRequest> = repositories.PullRequestRepository.findAll();
        expect(pullRequests.length).to.eq(1);
        expect(pullRequests[0].author.username).to.eq('emmap1');
        expect(pullRequests[0].author.displayName).to.eq('Emma');
        expect(pullRequests[0].title).to.eq('Title of pull request');
        expect(pullRequests[0].description).to.eq('Description of pull request');
    });
});
