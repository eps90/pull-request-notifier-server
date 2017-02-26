import {Comment} from "../model/comment";

export class CommentFactory {
    static create(rawObject: any): Comment {
        const comment = new Comment();

        if (rawObject.hasOwnProperty('id')) {
            comment.id = rawObject.id;
        }

        if (rawObject.hasOwnProperty('content')) {
            comment.content = rawObject.content;
        }

        if (rawObject.hasOwnProperty('links')) {
            comment.links = rawObject.links;
        }

        return comment;
    }
}
