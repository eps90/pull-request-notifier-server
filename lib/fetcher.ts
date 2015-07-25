///<reference path="../typings/tsd.d.ts"/>

import q = require('q');

import models = require('./models');
import repositories = require('./repositories');

export class Fetcher {
    static initPullRequestCollection(): q.Promise<any> {
        var deferred = q.defer();

        repositories.ProjectRepository.fetchAll().then((projects: Array<models.Project>) => {
            q.all(
                projects.map((project: models.Project) => {
                    return repositories.PullRequestRepository.fetchByProject(project);
                })
            ).done((values) => {
                deferred.resolve(null);
            });
        }).catch((error) => {
            deferred.reject(error);
        });

        return deferred.promise;
    }
}
