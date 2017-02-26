import {PullRequestLinks} from "../model/pull_request_links";

export class PullRequestLinksFactory {
    static create(rawObject: any): PullRequestLinks {
        const links = new PullRequestLinks();

        if (rawObject.hasOwnProperty('self') && rawObject.self.hasOwnProperty('href')) {
            links.self = rawObject.self.href;
        }

        if (rawObject.hasOwnProperty('html') && rawObject.html.hasOwnProperty('href')) {
            links.html = rawObject.html.href;
        }

        return links;
    }
}
