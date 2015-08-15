///<reference path="../typings/tsd.d.ts"/>

import models = require('./models');
import factories = require('./factories');
import configModule = require('./config');
import errors = require('./errors');
import logger = require('./logger');

import request = require('request');
import q = require('q');
import _ = require('lodash');

import url = require('url');
import http = require('http');

// @todo Get rid of AbstractRepository and make its methods simple functions
class AbstractRepository {
    static getPagesList(response: any): Array<string> {
        if (!response.hasOwnProperty('next')) {
            return [];
        }

        var urlList: Array<string> = [];

        var nextPageUrlParams: url.Url = url.parse(response.next, true);
        delete nextPageUrlParams.search;

        var pageNum: number = Math.ceil(response.size / response.pagelen);

        var nextPageNum: number = nextPageUrlParams.query.page;
        for (var pageIndex = nextPageNum; pageIndex <= pageNum; pageIndex++) {
            nextPageUrlParams.query.page = pageIndex;
            var newUrl = url.format(nextPageUrlParams);
            urlList.push(newUrl);
        }

        return urlList;
    }

    static getRequestPromises(urls: Array<string>, authConfig: any): Array<q.Promise<any>> {
        var promises: Array<q.Promise<any>> = [];

        for (var urlIndex = 0; urlIndex < urls.length; urlIndex++) {
            var promise: () => q.Promise<any> = () => {
                var resourceUrl: string = urls[urlIndex];
                var deferred = q.defer();

                logger.info('About to make an HTTP request to %s', resourceUrl);
                request(resourceUrl, authConfig, (error, res: http.IncomingMessage, body) => {
                    if (error || res.statusCode !== 200) {
                        logger.error('Http request to %s failed', resourceUrl);
                        return deferred.reject(errors.HttpRequestError.throwError(resourceUrl, res, body));
                    }
                    logger.info('Http request to %s succeeded', resourceUrl);
                    var response: any = JSON.parse(body);
                    deferred.resolve(response.values);
                });

                return deferred.promise;
            };

            promises.push(promise());
        }

        return promises;
    }

    static getCollection<T extends models.ModelInterface>(type: {create: (rawObject: any) => T}, repoObjects: Array<any>): Array<T> {
        var result: Array<T> = [];

        for (var repoIndex: number = 0; repoIndex < repoObjects.length; repoIndex++) {
            var repo = type.create(repoObjects[repoIndex]);
            result.push(repo);
        }

        return result;
    }
}

export class ProjectRepository extends AbstractRepository {
    static repositories: Array<models.Project> = [];

    static findAll(): Array<models.Project> {
        return ProjectRepository.repositories;
    }

    static fetchAll(): q.Promise<Array<models.Project>> {
        var config = configModule.Config.getConfig();

        var resourceUrl: string = config.baseUrl + '/repositories/' + config.teamName;
        var requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        var defer = q.defer<Array<models.Project>>();

        logger.info('About to make an HTTP request to %s', resourceUrl);
        request(resourceUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.error('Http request to %s failed', resourceUrl);
                return defer.reject(errors.HttpRequestError.throwError(resourceUrl, res, body));
            }

            logger.info('Http request to %s succeeded', resourceUrl);
            var response: any = JSON.parse(body);
            var repos: any = response.values;
            var result: Array<models.Project> = AbstractRepository.getCollection<models.Project>(factories.ProjectFactory, repos);

            var rest = AbstractRepository.getRequestPromises(AbstractRepository.getPagesList(response), requestConfig);
            q.all(rest).done(
                (results: Array<any>) => {
                    for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        var resultRepos: any = results[resultIndex];
                        result = result.concat(this.getCollection<models.Project>(factories.ProjectFactory, resultRepos));
                    }

                    ProjectRepository.repositories = result;

                    defer.resolve(result);
                },
                (err) => {
                    return defer.reject(err);
                }
            );
        });

        return defer.promise;
    }
}

interface PullRequestSet {
    [repositoryName: string]: Array<models.PullRequest>;
}

export class PullRequestRepository extends AbstractRepository {
    static pullRequests: PullRequestSet = {};

    static findAll(): Array<models.PullRequest> {
        var foundPullRequests: Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                foundPullRequests = foundPullRequests.concat(PullRequestRepository.pullRequests[repositoryName]);
            }
        }

        return foundPullRequests;
    }

    static findByReviewer(username: string): Array<models.PullRequest> {
        var foundPullRequests: Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: models.PullRequest) => {
                    var reviewers = pr.reviewers;
                    for (var reviewerIndex = 0; reviewerIndex < reviewers.length; reviewerIndex++) {
                        var reviewer = reviewers[reviewerIndex];
                        if (reviewer.user.username === username) {
                            return true;
                        }
                    }

                    return false;
                });

                foundPullRequests = foundPullRequests.concat(prs);
            }
        }

        return foundPullRequests;
    }

    static findByAuthor(username: string): Array<models.PullRequest> {
        var foundPullRequests: Array<models.PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: models.PullRequest) => {
                    return pr.hasOwnProperty('author') && pr.author.username === username;
                });
                foundPullRequests = foundPullRequests.concat(prs);
            }
        }

        return foundPullRequests;
    }

    static findByUser(username: string): Array<models.PullRequest> {
        var result = this.findByAuthor(username).concat(this.findByReviewer(username));
        var pullRequests = _.uniq(result, (element: models.PullRequest) => {
            return element.targetRepository.fullName + '#' + element.id;
        });

        return pullRequests;
    }

    static add(pullRequest: models.PullRequest): void {
        var repositoryName = pullRequest.targetRepository.fullName;
        if (!PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
            PullRequestRepository.pullRequests[repositoryName] = [];
        }
        PullRequestRepository.pullRequests[repositoryName].push(pullRequest);
    }

    static update(pullRequest: models.PullRequest): void {
        var projectName = pullRequest.targetRepository.fullName;
        var projectPrs = this.pullRequests[projectName] || [];
        for (var prIndex = 0; prIndex < projectPrs.length; prIndex++) {
            var currentPullRequest: models.PullRequest = projectPrs[prIndex];
            if (currentPullRequest.id === pullRequest.id) {
                this.pullRequests[projectName].splice(prIndex, 1, pullRequest);
                return;
            }
        }

        this.add(pullRequest);
    }

    static remove(pullRequest: models.PullRequest): void {
        var projectName = pullRequest.targetRepository.fullName;
        var projectPrs = this.pullRequests[projectName] || [];
        for (var prIndex = 0; prIndex < projectPrs.length; prIndex++) {
            var currentPullRequest: models.PullRequest = projectPrs[prIndex];
            if (currentPullRequest.id === pullRequest.id) {
                this.pullRequests[projectName].splice(prIndex, 1);
                return;
            }
        }
    }

    // @todo to refactor
    static fetchByProject(project: models.Project): q.Promise<Array<models.PullRequest>> {
        var parsedUrl = url.parse(project.pullRequestsUrl);
        var config = configModule.Config.getConfig();

        var requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        delete parsedUrl.search;
        parsedUrl.query = {
            state: 'OPEN'
        };
        var pullRequestsUrl = url.format(parsedUrl);

        var defer = q.defer<Array<models.PullRequest>>();

        logger.info('About to make an HTTP request to %s', pullRequestsUrl);
        request(pullRequestsUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.error('Http request to %s failed', pullRequestsUrl);
                return defer.reject(errors.HttpRequestError.throwError(pullRequestsUrl, res, body));
            }

            var response: any = JSON.parse(body);
            var pullRequests: Array<any> = response.values;
            var result: Array<models.PullRequest> =
                AbstractRepository.getCollection<models.PullRequest>(factories.PullRequestFactory, pullRequests);

            q.all(
                result.map((pr: models.PullRequest) => {
                    var deferred = q.defer();

                    logger.info('About to make an HTTP request to %s', pr.selfLink);
                    request(pr.selfLink, requestConfig, (err, httpRes: http.IncomingMessage, innerBody) => {
                        if (error || httpRes.statusCode !== 200) {
                            logger.error('Http request to %s failed', pr.selfLink);
                            return deferred.reject(errors.HttpRequestError.throwError(pr.selfLink, httpRes, innerBody));
                        }

                        logger.info('Http request to %s succeeded', pr.selfLink);
                        var innerResponse = JSON.parse(innerBody);
                        deferred.resolve(factories.PullRequestFactory.create(innerResponse));
                    });

                    return deferred.promise;
                })
            ).then((prs: Array<models.PullRequest>) => {
                    result = prs;
                    var rest = AbstractRepository.getRequestPromises(AbstractRepository.getPagesList(response), requestConfig);
                    q.all(rest).done((results: Array<any>) => {
                        for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                            var resultPrs: any = results[resultIndex];
                            result = result.concat(this.getCollection<models.PullRequest>(factories.PullRequestFactory, resultPrs));
                        }

                        PullRequestRepository.pullRequests[project.fullName] = result;
                        defer.resolve(result);
                    });
                });
        });

        return defer.promise;
    }
}
