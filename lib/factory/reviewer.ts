import {FactoryInterface} from "./factory";
import {Reviewer} from "../model/reviewer";
import {UserFactory} from "./user";

export class ReviewerFactory implements FactoryInterface {
    static create(rawObject: any): Reviewer {
        const reviewer = new Reviewer();

        if (rawObject.hasOwnProperty('approved')) {
            reviewer.approved = rawObject.approved;
        }

        if (rawObject.hasOwnProperty('user')) {
            reviewer.user = UserFactory.create(rawObject.user);
        }

        return reviewer;
    }
}
