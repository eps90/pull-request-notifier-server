export class WebhookEvent {
    static PULLREQUEST_CREATED: string = 'webhook:pullrequest:created';
    static PULLREQUEST_UPDATED: string = 'webhook:pullrequest:updated';
    static PULLREQUEST_APPROVED: string = 'webhook:pullrequest:approved';
    static PULLREQUEST_UNAPPROVED: string = 'webhook:pullrequest:unapproved';
    static PULLREQUEST_FULFILLED: string = 'webhook:pullrequest:fulfilled';
    static PULLREQUEST_REJECTED: string = 'webhook:pullrequest:rejected';
    static PULLREQUEST_COMMENTED: string = 'webhook:comment:new';
}
