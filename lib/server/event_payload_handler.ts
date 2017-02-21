import * as q from 'q';
import {HandlerInterface} from "./webhook_handler/handler";
import {AddPullRequestHandler} from "./webhook_handler/add_pull_request_handler";
import {UpdatePullRequestHandler} from "./webhook_handler/update_pull_request_handler";
import {ClosePullRequestHandler} from "./webhook_handler/close_pull_request_handler";

export class EventPayloadHandler {
    // @todo Allow to, somehow, inject handlers
    private static handlers: HandlerInterface[] = [
        new AddPullRequestHandler(),
        new UpdatePullRequestHandler(),
        new ClosePullRequestHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): q.Promise<any> {
        const bodyDecoded = JSON.parse(bodyEncoded);
        const handlers: HandlerInterface[] = this.handlers.filter(handler => handler.supportsEvent(type));

        return q.all(
            handlers.map((handler: HandlerInterface) => handler.handlePayload(type, bodyDecoded))
        );
    }
}
