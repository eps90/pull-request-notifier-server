import * as q from 'q';

export interface HandlerInterface {
    handlePayload(type: string, bodyDecoded: any): q.Promise<any>;
    supportsEvent(eventType: string): boolean;
}
