/// <reference path="../typings/tsd.d.ts" />

export class Repository {
    name:string = '';
    fullName:string = '';

    constructor(repoObject?: any) {
        if (repoObject.hasOwnProperty('name')) {
            this.name = repoObject.name;
        }

        if (repoObject.hasOwnProperty('full_name')) {
            this.fullName = repoObject.full_name;
        }
    }
}

export class User {
    username:string;
    displayName:string;

    constructor(userObject?: any) {
        if (userObject.hasOwnProperty('username')) {
            this.username = userObject.username;
        }

        if (userObject.hasOwnProperty('display_name')) {
            this.displayName = userObject.display_name;
        }
    }
}

export class Reviewer {
    approved:boolean;
    user: User;

    constructor(reviewerObject?: any) {
        if (reviewerObject.hasOwnProperty('approved')) {
            this.approved = reviewerObject.approved;
        }

        if (reviewerObject.hasOwnProperty('user')) {
            this.user = new User(reviewerObject.user);
        }
    }
}
