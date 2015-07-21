///<reference path="../typings/tsd.d.ts"/>

import models = require('./../lib/models');

export interface FactoryInterface {
    create(rawObject: any): models.ModelInterface;
}

export class ProjectFactory implements FactoryInterface {
    create(rawObject: any): models.Repository {
        var project = new models.Repository();

        if (rawObject.hasOwnProperty('name')) {
            project.name = rawObject.name;
        }

        if (rawObject.hasOwnProperty('full_name')) {
            project.fullName = rawObject.full_name;
        }

        if (rawObject.hasOwnProperty('links')) {
            project.pullRequestsUrl = rawObject.links.pullrequests.href;
        }

        return project;
    }
}

export class UserFactory implements FactoryInterface {
    create(rawObject: any): models.User {
        var user = new models.User();

        if (rawObject.hasOwnProperty('username')) {
            user.username = rawObject.username;
        }

        if (rawObject.hasOwnProperty('display_name')) {
            user.displayName = rawObject.display_name;
        }

        return user;
    }
}
