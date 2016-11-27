///<reference path="../typings/index.d.ts"/>

import q = require('q');

import models = require('./models');
import repositories = require('./repositories');
import logger = require('./logger');

export class Fetcher {
    static initPullRequestCollection(): q.Promise<any> {
        logger.logInitializingPullRequests();

        var deferred = q.defer();

        repositories.ProjectRepository.fetchAll().then((projects: Array<models.Project>) => {
            q.all(
                projects.map((project: models.Project) => {
                    return repositories.PullRequestRepository.fetchByProject(project);
                })
            ).done((values) => {
                logger.logPullRequestsInitialized(repositories.PullRequestRepository.findAll().length);
                deferred.resolve(null);
            });
        }).catch((error) => {
            logger.logInitializationFailed();
            deferred.reject(error);
        });

        return deferred.promise;
    }
}
