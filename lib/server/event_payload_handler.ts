import {EventDispatcher} from '../events/event_dispatcher';
import * as q from 'q';
import {HandlerInterface} from "./handler/handler";
import {PullRequestCreationHandler} from "./handler/pull_request_creation_handler";
import {PullRequestUpdateHandler} from "./handler/pull_request_update_handler";
import {PullRequestCloseHandler} from "./handler/pull_request_close_handler";

export class EventPayloadHandler {
    // @todo Allow to, somehow, inject handlers
    private static handlers: HandlerInterface[] = [
        new PullRequestCreationHandler(),
        new PullRequestUpdateHandler(),
        new PullRequestCloseHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): q.Promise<any> {
        const bodyDecoded = JSON.parse(bodyEncoded);
        const handlers: HandlerInterface[] = this.handlers.filter(handler => handler.supportsEvent(type));

        return q.all(
            handlers.map((handler: HandlerInterface) => handler.handlePayload(type, bodyDecoded))
        );
    }
}
