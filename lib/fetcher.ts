///<reference path="../typings/tsd.d.ts"/>

import q = require('q');

import models = require('./models');
import repositories = require('./repositories');
import logger = require('./logger');

export class Fetcher {
    static initPullRequestCollection(): q.Promise<any> {
        logger.info('Initializing pull requests');

        var deferred = q.defer();

        repositories.ProjectRepository.fetchAll().then((projects: Array<models.Project>) => {
            q.all(
                projects.map((project: models.Project) => {
                    return repositories.PullRequestRepository.fetchByProject(project);
                })
            ).done((values) => {
                logger.info(
                    'Pull request collection initialized',
                    {pullRequestCount: repositories.PullRequestRepository.findAll().length}
                );
                deferred.resolve(null);
            });
        }).catch((error) => {
            logger.error('Initialization failed.');
            deferred.reject(error);
        });

        return deferred.promise;
    }
}
