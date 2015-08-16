///<reference path="../../typings/tsd.d.ts"/>
///<reference path="../../custom_typings/nock.d.ts"/>


import chai = require('chai');
var expect = chai.expect;

import models = require('./../../lib/models');
import repositories = require('./../../lib/repositories');
import eventPayloadHandler = require('./../../lib/server/event_payload_handler');
import eventDispatcher = require('./../../lib/events/event_dispatcher');
import nock = require('nock');
import configModule = require('./../../lib/config');

describe('EventPayloadHandler', () => {
    var basicAuth = {
        user: 'my.user',
        pass: 'topsecret'
    };

    beforeEach(() => {
        var appConfig = {
            baseUrl: 'http://example.com',
            teamName: 'bitbucket',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        configModule.Config.setUp({config: appConfig});
    });

    afterEach(() => {
        configModule.Config.reset();
    });

    describe('PullRequestHandler', () => {
        beforeEach(() => {
            repositories.PullRequestRepository.pullRequests = {};
        });

        it('should create add new pull request to repository on pullrequest:created', (done) => {
            var eventType = 'pullrequest:created';
            var prEncoded = {
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
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            var actorEncoded = {
                username: 'john.smith',
                display_name: 'John Smith'
            };
            var payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            var payloadString = JSON.stringify(payload);
            eventPayloadHandler.EventPayloadHandler.handlePayload(eventType, payloadString).then(() => {
                var pullRequests: Array<models.PullRequest> = repositories.PullRequestRepository.findAll();
                expect(pullRequests.length).to.eq(1);
                expect(pullRequests[0].author.username).to.eq('emmap1');
                expect(pullRequests[0].author.displayName).to.eq('Emma');
                expect(pullRequests[0].title).to.eq('Title of pull request');
                expect(pullRequests[0].description).to.eq('Description of pull request');
                done();
            });
        });

        function createUpdateLikePayload(eventKey: string, done): void {
            var prEncoded = {
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
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            var actorEncoded = {
                username: 'john.smith',
                display_name: 'John Smith'
            };

            var payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            var payloadString = JSON.stringify(payload);

            var sampleProject = new models.Project();
            sampleProject.fullName = 'team_name/repo_name';

            var samplePr = new models.PullRequest();
            samplePr.id = 1;
            samplePr.title = 'This is sample title';
            samplePr.state = models.PullRequestState.Declined;
            samplePr.targetRepository = sampleProject;
            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [samplePr];

            eventPayloadHandler.EventPayloadHandler.handlePayload(eventKey, payloadString).then(() => {
                var pullRequests = repositories.PullRequestRepository.findAll();
                expect(pullRequests.length).to.eq(1);
                expect(pullRequests[0].title).to.eq('Title of pull request');
                expect(pullRequests[0].state).to.eq(models.PullRequestState.Open);
                done();
            });
        }

        it('should update a pull request on pullrequest:updated', (done) => {
            var eventType = 'pullrequest:updated';
            createUpdateLikePayload(eventType, done);
        });

        it('should update a pull request on pullrequest:approved', (done) => {
            var eventType = 'pullrequest:approved';
            createUpdateLikePayload(eventType, done);
        });

        it('should update a pull request on pullrequest:unapproved', (done) => {
            var eventType = 'pullrequest:unapproved';
            createUpdateLikePayload(eventType, done);
        });

        function createCloseLikePayload(eventKey: string, done): void {
            var prEncoded = {
                "id" :  1 ,
                "title" :  "Title of pull request" ,
                "description" :  "Description of pull request" ,
                "state" :  "MERGED" ,
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
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            var actorEncoded = {
                "username": 'john.smith',
                "display_name": "John Smith"
            };
            var payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            var payloadString = JSON.stringify(payload);

            var sampleProject = new models.Project();
            sampleProject.fullName = 'team_name/repo_name';

            var samplePr = new models.PullRequest();
            samplePr.id = 1;
            samplePr.targetRepository = sampleProject;
            repositories.PullRequestRepository.pullRequests['team_name/repo_name'] = [samplePr];

            eventPayloadHandler.EventPayloadHandler.handlePayload(eventKey, payloadString).then(() => {
                var pullRequests = repositories.PullRequestRepository.findAll();
                expect(pullRequests.length).to.eq(0);
                done();
            });
        }

        it('should remove a pull request on pullrequest:fulfilled', (done) => {
            var eventType = 'pullrequest:fulfilled';
            createCloseLikePayload(eventType, done);
        });

        it('should remove a pull request on pullrequest:rejected', (done) => {
            var eventType = 'pullrequest:rejected';
            createCloseLikePayload(eventType, done);
        });
    });

    describe('Emitting events', () => {
        var dispatcher = eventDispatcher.EventDispatcher.getInstance();

        beforeEach(() => {
            dispatcher.removeAllListeners();
        });

        function testEmittingEvents(inputEventType, expectedEventType, done): void {
            var eventType = inputEventType;
            var prEncoded = {
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
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            var actorEncoded = {
                username: 'john.smith',
                display_name: 'John Smith'
            };

            var payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            dispatcher.once(expectedEventType, (pullRequestPayload: eventPayloadHandler.PullRequestWithActor) => {
                expect(pullRequestPayload.pullRequest.id).to.eq(payload.pullrequest.id);
                expect(pullRequestPayload.actor.username).to.eq('john.smith');
                done();
            });

            var payloadString = JSON.stringify(payload);
            eventPayloadHandler.EventPayloadHandler.handlePayload(eventType, payloadString);
        }

        it('should emit webhook:pullrequest:created on pullrequest:created event payload', (done) => {
            var eventType = 'pullrequest:created';
            var emittedEventType = 'webhook:pullrequest:created';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:updated on pullrequest:updated event payload', (done) => {
            var eventType = 'pullrequest:updated';
            var emittedEventType = 'webhook:pullrequest:updated';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:approved on pullrequest:approved event payload', (done) => {
            var eventType = 'pullrequest:approved';
            var emittedEventType = 'webhook:pullrequest:approved';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:unapproved on pullrequest:unapproved event payload', (done) => {
            var eventType = 'pullrequest:unapproved';
            var emittedEventType = 'webhook:pullrequest:unapproved';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:rejected on pullrequest:rejected event payload', (done) => {
            var eventType = 'pullrequest:rejected';
            var emittedEventType = 'webhook:pullrequest:rejected';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:fulfilled on pullrequest:fulfilled event payload', (done) => {
            var eventType = 'pullrequest:fulfilled';
            var emittedEventType = 'webhook:pullrequest:fulfilled';
            testEmittingEvents(eventType, emittedEventType, done);
        });
    });
});
