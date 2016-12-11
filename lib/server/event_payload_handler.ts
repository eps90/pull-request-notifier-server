import {EventDispatcher} from '../events/event_dispatcher';
import * as q from 'q';
import {HandlerInterface} from "./handler/handler";
import {PullRequestHandler} from "./handler/pull_request_handler";

export class EventPayloadHandler {
    private static handlers: HandlerInterface[] = [
        new PullRequestHandler()
    ];

    static handlePayload(type: string, bodyEncoded: string): q.Promise<any> {
        const bodyDecoded = JSON.parse(bodyEncoded);
        const handlers: HandlerInterface[] = this.handlers.filter(handler => handler.supportsEvent(type));

        return q.all(
            handlers.map((handler: HandlerInterface) => {
                return q.Promise((resolve) => {
                    handler.handlePayload(type, bodyDecoded).then((handleResult) => {
                        this.triggerEvent(type, handleResult);
                        resolve(null);
                    });
                });
            })
        );
    }

    private static triggerEvent(payloadType: string, contents: any = {}): void {
        const eventName = 'webhook:' + payloadType;
        EventDispatcher.getInstance().emit(eventName, contents);
    }
}
