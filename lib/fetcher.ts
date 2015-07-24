///<reference path="../typings/tsd.d.ts"/>

import q = require('q');

import models = require('./models');
import repositories = require('./repositories');
import configModule = require('./config');

export class Fetcher {
    static initPullRequestCollection(config: configModule.ConfigInterface): q.Promise<any> {
        var deferred = q.defer();
        var projectRepository = new repositories.ProjectRepository(config);
        var pullRequestRepository = new repositories.PullRequestRepository(config);

        projectRepository.fetchAll().then((projects: Array<models.Project>) => {
            q.all(
                projects.map((project: models.Project) => {
                    return pullRequestRepository.fetchByProject(project);
                })
            ).done((values) => {
                deferred.resolve(null)
            });
        }).catch((error) => {
            deferred.reject(error);
        });

        return deferred.promise;
    }
}
