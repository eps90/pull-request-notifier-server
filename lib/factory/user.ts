import {User} from "../model/user";

export class UserFactory {
    static create(rawObject: any): User {
        const user = new User();

        if (rawObject.hasOwnProperty('uuid')) {
            user.uuid = rawObject.uuid;
        }

        if (rawObject.hasOwnProperty('username')) {
            user.username = rawObject.username;
        }

        if (rawObject.hasOwnProperty('display_name')) {
            user.displayName = rawObject.display_name;
        }

        return user;
    }
}
