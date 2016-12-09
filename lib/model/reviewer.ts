import {ModelInterface} from "./model";
import {User} from "./user";

export class Reviewer implements ModelInterface {
    approved: boolean;
    user: User = new User();
}
