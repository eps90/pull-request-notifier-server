// @todo Clean up
interface IPullRequestLink {
    href: string;
}

interface IPullRequestLinks {
    self?: IPullRequestLink;
    html?: IPullRequestLink;
}

export interface PullRequestWithLinks {
    links?: IPullRequestLinks
}

export class PullRequestLinks {
    self: string;
    html: string;
}
