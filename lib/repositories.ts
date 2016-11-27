///<reference path="../typings/tsd.d.ts"/>

import {ModelInterface, PullRequest, Project, PullRequestState} from './models';
import {ProjectFactory, PullRequestFactory} from './factories';
import {Config} from "./config";
import {HttpRequestError} from "./errors";
// @todo Change to default export
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

                logger.logHttpRequestAttempt(resourceUrl);
                request(resourceUrl, authConfig, (error, res: http.IncomingMessage, body) => {
                    if (error || res.statusCode !== 200) {
                        logger.logHttpRequestFailed(resourceUrl);
                        return deferred.reject(HttpRequestError.throwError(resourceUrl, res, body));
                    }
                    logger.logHttpRequestSucceed(resourceUrl);
                    var response: any = JSON.parse(body);
                    deferred.resolve(response.values);
                });

                return deferred.promise;
            };

            promises.push(promise());
        }

        return promises;
    }

    static getCollection<T extends ModelInterface>(type: {create: (rawObject: any) => T}, repoObjects: Array<any>): Array<T> {
        var result: Array<T> = [];

        for (var repoIndex: number = 0; repoIndex < repoObjects.length; repoIndex++) {
            var repo = type.create(repoObjects[repoIndex]);
            result.push(repo);
        }

        return result;
    }
}

export class ProjectRepository extends AbstractRepository {
    static repositories: Array<Project> = [];

    static findAll(): Array<Project> {
        return ProjectRepository.repositories;
    }

    static fetchAll(): q.Promise<Array<Project>> {
        var config = Config.getConfig();

        var resourceUrl: string = config.baseUrl + '/repositories/' + config.teamName;
        var requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        var defer = q.defer<Array<Project>>();

        logger.logHttpRequestAttempt(resourceUrl);
        request(resourceUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.logHttpRequestFailed(resourceUrl);
                return defer.reject(HttpRequestError.throwError(resourceUrl, res, body));
            }

            logger.logHttpRequestSucceed(resourceUrl);
            var response: any = JSON.parse(body);
            var repos: any = response.values;
            var result: Array<Project> = AbstractRepository.getCollection<Project>(ProjectFactory, repos);

            var rest = AbstractRepository.getRequestPromises(AbstractRepository.getPagesList(response), requestConfig);
            q.all(rest).done(
                (results: Array<any>) => {
                    for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        var resultRepos: any = results[resultIndex];
                        result = result.concat(this.getCollection<Project>(ProjectFactory, resultRepos));
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
    [repositoryName: string]: Array<PullRequest>;
}

export class PullRequestRepository extends AbstractRepository {
    static pullRequests: PullRequestSet = {};

    static findAll(): Array<PullRequest> {
        var foundPullRequests: Array<PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                foundPullRequests = foundPullRequests.concat(PullRequestRepository.pullRequests[repositoryName]);
            }
        }

        return foundPullRequests;
    }

    static findByReviewer(username: string): Array<PullRequest> {
        var foundPullRequests: Array<PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: PullRequest) => {
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

    static findByAuthor(username: string): Array<PullRequest> {
        var foundPullRequests: Array<PullRequest> = [];
        for (var repositoryName in PullRequestRepository.pullRequests) {
            if (PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
                var prs = PullRequestRepository.pullRequests[repositoryName].filter((pr: PullRequest) => {
                    return pr.hasOwnProperty('author') && pr.author.username === username;
                });
                foundPullRequests = foundPullRequests.concat(prs);
            }
        }

        return foundPullRequests;
    }

    static findByUser(username: string): Array<PullRequest> {
        var result = this.findByAuthor(username).concat(this.findByReviewer(username));
        var pullRequests = _.uniq(result, (element: PullRequest) => {
            return element.targetRepository.fullName + '#' + element.id;
        });

        return pullRequests;
    }

    static add(pullRequest: PullRequest): void {
        var repositoryName = pullRequest.targetRepository.fullName;
        if (!PullRequestRepository.pullRequests.hasOwnProperty(repositoryName)) {
            PullRequestRepository.pullRequests[repositoryName] = [];
        }
        PullRequestRepository.pullRequests[repositoryName].push(pullRequest);
    }

    static update(pullRequest: PullRequest): void {
        if (pullRequest.state !== PullRequestState.Open) {
            return this.remove(pullRequest);
        }

        var projectName = pullRequest.targetRepository.fullName;
        var projectPrs = this.pullRequests[projectName] || [];
        for (var prIndex = 0; prIndex < projectPrs.length; prIndex++) {
            var currentPullRequest: PullRequest = projectPrs[prIndex];
            if (currentPullRequest.id === pullRequest.id) {
                this.pullRequests[projectName].splice(prIndex, 1, pullRequest);
                return;
            }
        }

        this.add(pullRequest);
    }

    static remove(pullRequest: PullRequest): void {
        var projectName = pullRequest.targetRepository.fullName;
        var projectPrs = this.pullRequests[projectName] || [];
        for (var prIndex = 0; prIndex < projectPrs.length; prIndex++) {
            var currentPullRequest: PullRequest = projectPrs[prIndex];
            if (currentPullRequest.id === pullRequest.id) {
                this.pullRequests[projectName].splice(prIndex, 1);
                return;
            }
        }
    }

    // @todo to refactor
    static fetchByProject(project: Project): q.Promise<Array<PullRequest>> {
        var parsedUrl = url.parse(project.pullRequestsUrl);
        var config = Config.getConfig();

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

        var defer = q.defer<Array<PullRequest>>();

        logger.logHttpRequestAttempt(pullRequestsUrl);
        request(pullRequestsUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.logHttpRequestFailed(pullRequestsUrl);
                return defer.reject(HttpRequestError.throwError(pullRequestsUrl, res, body));
            }
            logger.logHttpRequestSucceed(pullRequestsUrl);

            var response: any = JSON.parse(body);
            var pullRequests: Array<any> = response.values;
            var result: Array<PullRequest> =
                AbstractRepository.getCollection<PullRequest>(PullRequestFactory, pullRequests);

            q.all(
                result.map((pr: PullRequest) => {
                    var deferred = q.defer();

                    logger.logHttpRequestAttempt(pr.links.self);
                    request(pr.links.self, requestConfig, (err, httpRes: http.IncomingMessage, innerBody) => {
                        if (error || httpRes.statusCode !== 200) {
                            logger.logHttpRequestFailed(pr.links.self);
                            return deferred.reject(HttpRequestError.throwError(pr.links.self, httpRes, innerBody));
                        }

                        logger.logHttpRequestSucceed(pr.links.self);
                        var innerResponse = JSON.parse(innerBody);
                        deferred.resolve(PullRequestFactory.create(innerResponse));
                    });

                    return deferred.promise;
                })
            ).then((prs: Array<PullRequest>) => {
                    result = prs;
                    var rest = AbstractRepository.getRequestPromises(AbstractRepository.getPagesList(response), requestConfig);
                    q.all(rest).done((results: Array<any>) => {
                        for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                            var resultPrs: any = results[resultIndex];
                            result = result.concat(this.getCollection<PullRequest>(PullRequestFactory, resultPrs));
                        }

                        PullRequestRepository.pullRequests[project.fullName] = result;
                        defer.resolve(result);
                    });
                });
        });

        return defer.promise;
    }

    static fetchOne(pullRequestUrl: string): q.Promise<PullRequest>;
    static fetchOne(project: Project, prId: number): q.Promise<PullRequest>;

    static fetchOne(projectOrUrl: any, prId?: number): q.Promise<PullRequest> {
        var deferred = q.defer<PullRequest>();
        var config = Config.getConfig();
        var prUrl = '';

        if (typeof projectOrUrl === 'string') {
            prUrl = projectOrUrl;
        } else {
            prUrl = config.baseUrl + '/repositories/' + projectOrUrl.fullName + '/pullrequests/' + prId;
        }

        var requestConfig = {
            auth: {
                username: config.user,
                password: config.password
            }
        };

        logger.logHttpRequestAttempt(prUrl);
        request(prUrl, requestConfig, (error, res: http.IncomingMessage, body) => {
            if (error || res.statusCode !== 200) {
                logger.logHttpRequestFailed(prUrl);
                return deferred.reject(HttpRequestError.throwError(prUrl, res, body));
            }
            logger.logHttpRequestSucceed(prUrl);

            var response: any = JSON.parse(body);
            var pullRequest = PullRequestFactory.create(response);
            deferred.resolve(pullRequest);
        });

        return deferred.promise;
    }
}
