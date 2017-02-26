export interface ILink {
    href: string;
}

export interface ICommentLinks {
    self?: ILink;
    html?: ILink;
}

export interface ICommentContent {
    raw?: string;
    html?: string;
    markup?: string;
}

export class Comment {
    id: number;
    content: ICommentContent;
    links: ICommentLinks;
}
