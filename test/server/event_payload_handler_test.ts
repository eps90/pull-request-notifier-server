import {expect} from 'chai';
import {PullRequest, Project, PullRequestState, PullRequestWithActor} from '../../lib/model';
import {PullRequestRepository} from '../../lib/repository';
import {EventPayloadHandler} from '../../lib/server/event_payload_handler';
import {EventDispatcher} from '../../lib/events/event_dispatcher';
import * as nock from 'nock';
import {Config} from '../../lib/config';
import {PullRequestWithComment} from "../../lib/model/pull_request_with_comment";
import {WebhookEvent} from "../../lib/model/event/webhook_event";

describe('EventPayloadHandler', () => {
    const basicAuth = {
        user: 'my.user',
        pass: 'topsecret'
    };

    beforeEach(() => {
        const appConfig = {
            baseUrl: 'http://example.com',
            teamName: 'bitbucket',
            user: 'my.user',
            password: 'topsecret',
            webhook_port: 1234,
            socket_port: 4321
        };

        Config.setUp({config: appConfig});
    });

    afterEach(() => {
        Config.reset();
    });

    describe('PullRequestHandler', () => {
        beforeEach(() => {
            PullRequestRepository.pullRequests = {};
        });

        it('should create add new pull request to repository on pullrequest:created', (done) => {
            const eventType = 'pullrequest:created';
            const prEncoded = {
                "id": 1,
                "title": "Title of pull request",
                "description": "Description of pull request",
                "state": "OPEN",
                "author": {
                    "username": "emmap1",
                    "display_name": "Emma"
                },
                "destination": {
                    "branch": {"name": "master"},
                    "repository": {
                        "full_name": "team_name/repo_name",
                        "name": "repo_name"
                    }
                },
                "participants": [
                    // @todo
                ],
                "links": {
                    "self": {
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            const actorEncoded = {
                username: 'john.smith',
                display_name: 'John Smith'
            };
            const payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            const payloadString = JSON.stringify(payload);
            EventPayloadHandler.handlePayload(eventType, payloadString).then(() => {
                const pullRequests = PullRequestRepository.findAll();
                expect(pullRequests.length).to.eq(1);
                expect(pullRequests[0].author.username).to.eq('emmap1');
                expect(pullRequests[0].author.displayName).to.eq('Emma');
                expect(pullRequests[0].title).to.eq('Title of pull request');
                expect(pullRequests[0].description).to.eq('Description of pull request');
                done();
            });
        });

        function createUpdateLikePayload(eventKey: string, done): void {
            const prEncoded = {
                "id": 1,
                "title": "Title of pull request",
                "description": "Description of pull request",
                "state": "OPEN",
                "author": {
                    "username": "emmap1",
                    "display_name": "Emma"
                },
                "destination": {
                    "branch": {"name": "master"},
                    "repository": {
                        "full_name": "team_name/repo_name",
                        "name": "repo_name"
                    }
                },
                "participants": [
                    // @todo
                ],
                "links": {
                    "self": {
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            const actorEncoded = {
                username: 'john.smith',
                display_name: 'John Smith'
            };

            const payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            const payloadString = JSON.stringify(payload);

            const sampleProject = new Project();
            sampleProject.fullName = 'team_name/repo_name';

            const samplePr = new PullRequest();
            samplePr.id = 1;
            samplePr.title = 'This is sample title';
            samplePr.state = PullRequestState.Declined;
            samplePr.targetRepository = sampleProject;
            PullRequestRepository.pullRequests['team_name/repo_name'] = [samplePr];

            EventPayloadHandler.handlePayload(eventKey, payloadString).then(() => {
                const pullRequests = PullRequestRepository.findAll();
                expect(pullRequests.length).to.eq(1);
                expect(pullRequests[0].title).to.eq('Title of pull request');
                expect(pullRequests[0].state).to.eq(PullRequestState.Open);
                done();
            });
        }

        it('should update a pull request on pullrequest:updated', (done) => {
            const eventType = 'pullrequest:updated';
            createUpdateLikePayload(eventType, done);
        });

        it('should update a pull request on pullrequest:approved', (done) => {
            const eventType = 'pullrequest:approved';
            createUpdateLikePayload(eventType, done);
        });

        it('should update a pull request on pullrequest:unapproved', (done) => {
            const eventType = 'pullrequest:unapproved';
            createUpdateLikePayload(eventType, done);
        });

        function createCloseLikePayload(eventKey: string, done): void {
            const prEncoded = {
                "id": 1,
                "title": "Title of pull request",
                "description": "Description of pull request",
                "state": "MERGED",
                "author": {
                    "username": "emmap1",
                    "display_name": "Emma"
                },
                "destination": {
                    "branch": {"name": "master"},
                    "repository": {
                        "full_name": "team_name/repo_name",
                        "name": "repo_name"
                    }
                },
                "participants": [
                    // @todo
                ],
                "links": {
                    "self": {
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            const actorEncoded = {
                "username": 'john.smith',
                "display_name": "John Smith"
            };
            const payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            const payloadString = JSON.stringify(payload);

            const sampleProject = new Project();
            sampleProject.fullName = 'team_name/repo_name';

            const samplePr = new PullRequest();
            samplePr.id = 1;
            samplePr.targetRepository = sampleProject;
            PullRequestRepository.pullRequests['team_name/repo_name'] = [samplePr];

            EventPayloadHandler.handlePayload(eventKey, payloadString).then(() => {
                const pullRequests = PullRequestRepository.findAll();
                expect(pullRequests.length).to.eq(0);
                done();
            });
        }

        it('should remove a pull request on pullrequest:fulfilled', (done) => {
            const eventType = 'pullrequest:fulfilled';
            createCloseLikePayload(eventType, done);
        });

        it('should remove a pull request on pullrequest:rejected', (done) => {
            const eventType = 'pullrequest:rejected';
            createCloseLikePayload(eventType, done);
        });
    });

    describe('Emitting events', () => {
        const dispatcher = EventDispatcher.getInstance();

        beforeEach(() => {
            dispatcher.removeAllListeners();
        });

        function testEmittingEvents(inputEventType, expectedEventType, done): void {
            const eventType = inputEventType;
            const prEncoded = {
                "id": 1,
                "title": "Title of pull request",
                "description": "Description of pull request",
                "state": "OPEN",
                "author": {
                    "username": "emmap1",
                    "display_name": "Emma"
                },
                "destination": {
                    "branch": {"name": "master"},
                    "repository": {
                        "full_name": "team_name/repo_name",
                        "name": "repo_name"
                    }
                },
                "participants": [
                    // @todo
                ],
                "links": {
                    "self": {
                        "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                    }
                }
            };
            const actorEncoded = {
                username: 'john.smith',
                display_name: 'John Smith'
            };

            const payload = {
                pullrequest: prEncoded,
                actor: actorEncoded
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(prEncoded));

            dispatcher.once(expectedEventType, (pullRequestPayload: PullRequestWithActor) => {
                expect(pullRequestPayload.pullRequest.id).to.eq(payload.pullrequest.id);
                expect(pullRequestPayload.actor.username).to.eq('john.smith');
                done();
            });

            const payloadString = JSON.stringify(payload);
            EventPayloadHandler.handlePayload(eventType, payloadString);
        }

        it('should emit webhook:pullrequest:created on pullrequest:created event payload', (done) => {
            const eventType = 'pullrequest:created';
            const emittedEventType = 'webhook:pullrequest:created';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:updated on pullrequest:updated event payload', (done) => {
            const eventType = 'pullrequest:updated';
            const emittedEventType = 'webhook:pullrequest:updated';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:approved on pullrequest:approved event payload', (done) => {
            const eventType = 'pullrequest:approved';
            const emittedEventType = 'webhook:pullrequest:approved';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:unapproved on pullrequest:unapproved event payload', (done) => {
            const eventType = 'pullrequest:unapproved';
            const emittedEventType = 'webhook:pullrequest:unapproved';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:rejected on pullrequest:rejected event payload', (done) => {
            const eventType = 'pullrequest:rejected';
            const emittedEventType = 'webhook:pullrequest:rejected';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:pullrequest:fulfilled on pullrequest:fulfilled event payload', (done) => {
            const eventType = 'pullrequest:fulfilled';
            const emittedEventType = 'webhook:pullrequest:fulfilled';
            testEmittingEvents(eventType, emittedEventType, done);
        });

        it('should emit webhook:comment:new on pullrequest:comment_created event payload', (done) => {
            const commentPayload = {
                actor: {
                    "username": 'john.smith',
                    "display_name": 'John Smith'
                },
                pullrequest: {
                    "id": 1,
                    "author": {
                        "username": "anna.kowalsky",
                        "display_name": "Anna Kowalsky"
                    },
                    "links": {
                        "self": {
                            "href": "http://example.com/repositories/bitbucket/bitbucket/pullrequests/1"
                        }
                    }
                },
                comment: {
                    "id": 3,
                    "content": {
                        "raw": "abc",
                        "html": "<b>abc</b>",
                        "markup": "**abc**"
                    },
                    "links": {
                        "self": {
                            "href": "http://example.com/self"
                        },
                        "html": {
                            "href": "http://example.com/html"
                        }
                    }
                }
            };

            nock('http://example.com')
                .get('/repositories/bitbucket/bitbucket/pullrequests/1')
                .basicAuth(basicAuth)
                .reply(200, JSON.stringify(commentPayload.pullrequest));

            const expectedEventType = WebhookEvent.PULLREQUEST_COMMENTED;
            dispatcher.once(expectedEventType, (pullRequestWithComment: PullRequestWithComment) => {
                expect(pullRequestWithComment.pullRequest.id).to.eq(1);
                expect(pullRequestWithComment.pullRequest.author.username).to.eq('anna.kowalsky');
                expect(pullRequestWithComment.actor.username).to.eq('john.smith');
                expect(pullRequestWithComment.comment.id).to.eq(3);
                expect(pullRequestWithComment.comment.links.html.href).to.eq('http://example.com/html');
                done();
            });

            const payloadString = JSON.stringify(commentPayload);
            const payloadEventType = 'pullrequest:comment_created';
            EventPayloadHandler.handlePayload(payloadEventType, payloadString);
        });
    });
});
