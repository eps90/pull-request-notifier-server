///<reference path="typings/tsd.d.ts"/>

import configModule = require('./lib/config');
import repositories = require('./lib/repositories');
import models = require('./lib/models');
import q = require('q');

var configInstance = new configModule.Config();
var config = configInstance.config;

var projectRepository = new repositories.ProjectRepository(config);
var pullRequestRepository = new repositories.PullRequestRepository(config);
projectRepository.fetchAll().then((projects: Array<models.Project>) => {
    return q.all(projects.map((element: models.Project) => {
        return pullRequestRepository.fetchByProject(element);
    }));
}).then(() => {
    console.log(repositories.PullRequestRepository.pullRequests);
}).catch((error) => {
    console.log(error);
});
