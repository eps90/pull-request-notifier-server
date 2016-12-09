import {FactoryInterface} from "./factory";
import {User} from "../model/user";

export class UserFactory implements FactoryInterface {
    static create(rawObject: any): User {
        const user = new User();

        if (rawObject.hasOwnProperty('username')) {
            user.username = rawObject.username;
        }

        if (rawObject.hasOwnProperty('display_name')) {
            user.displayName = rawObject.display_name;
        }

        return user;
    }
}
